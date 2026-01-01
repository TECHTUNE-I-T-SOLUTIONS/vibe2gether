import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference required" },
        { status: 400 }
      )
    }

    // Get current session for user ID
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log(`[PAYSTACK] Verifying payment reference: ${reference}`)

    // First check local transaction status
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("payment_reference", reference)
      .eq("user_id", userId)
      .single()

    if (txError || !transaction) {
      console.error("[PAYSTACK] Transaction not found:", txError)
      return NextResponse.json(
        { error: "Transaction not found", status: "pending" },
        { status: 404 }
      )
    }

    console.log(`[PAYSTACK] Transaction found with status: ${transaction.status}`)

    // If already completed, return success
    if (transaction.status === "completed") {
      return NextResponse.json({
        success: true,
        status: "completed",
        coinsAdded: transaction.metadata?.coinsAmount || 0,
        amount: transaction.amount,
      })
    }

    // If pending, verify with Paystack
    if (transaction.status === "pending" && PAYSTACK_SECRET_KEY) {
      try {
        const paystackResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          }
        )

        if (!paystackResponse.ok) {
          console.error("[PAYSTACK] Verification failed with Paystack")
          return NextResponse.json(
            { error: "Verification failed", status: "pending" },
            { status: 400 }
          )
        }

        const paystackData = await paystackResponse.json()

        if (!paystackData.status || paystackData.data.status !== "success") {
          console.log(`[PAYSTACK] Payment status from Paystack: ${paystackData.data.status}`)
          return NextResponse.json({
            success: false,
            status: paystackData.data.status,
          })
        }

        // Payment is successful, update transaction
        console.log(`[PAYSTACK] Payment verified successfully, updating transaction`)

        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            metadata: {
              ...transaction.metadata,
              verified_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        if (updateError) {
          console.error("[PAYSTACK] Failed to update transaction:", updateError)
          return NextResponse.json({
            success: false,
            error: "Failed to update transaction",
            status: "error",
          })
        }

        // Add coins to user if not already done
        if (transaction.metadata?.coins_added) {
          console.log(`[PAYSTACK] Coins already added for transaction ${transaction.id}`)
          return NextResponse.json({
            success: true,
            status: "completed",
            coinsAdded: transaction.metadata?.coinsAmount || 0,
            amount: transaction.amount,
          })
        }

        const coinsAmount = transaction.metadata?.coinsAmount || Math.round((transaction.amount / 1450) * 500)

        const { data: user, error: fetchError } = await supabase
          .from("users")
          .select("coins_balance")
          .eq("id", transaction.user_id)
          .single()

        if (!fetchError && user) {
          const newBalance = (user.coins_balance || 0) + coinsAmount
          const { error: addCoinsError } = await supabase
            .from("users")
            .update({
              coins_balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", transaction.user_id)

          if (!addCoinsError) {
            console.log(`[PAYSTACK] Added ${coinsAmount} coins to user, new balance: ${newBalance}`)

            // Mark coins as added in transaction metadata
            await supabase
              .from("transactions")
              .update({
                metadata: {
                  ...transaction.metadata,
                  coins_added: true,
                  coins_added_at: new Date().toISOString(),
                },
              })
              .eq("id", transaction.id)

            // Check if coin transaction already exists for this payment
            const { data: existingCoinTx, error: checkError } = await supabase
              .from("coin_transactions")
              .select("id")
              .eq("reference_id", transaction.id)
              .eq("reference_type", "paystack_transaction")
              .single()

            // Only insert if it doesn't already exist
            if (!existingCoinTx && !checkError) {
              const { error: coinTxError } = await supabase
                .from("coin_transactions")
                .insert({
                  user_id: transaction.user_id,
                  amount: coinsAmount,
                  transaction_type: "purchase",
                  description: `Purchased ${coinsAmount} coins via Paystack (₦${transaction.amount.toFixed(2)})`,
                  reference_id: transaction.id,
                  reference_type: "paystack_transaction",
                  balance_after: newBalance,
                  created_at: new Date().toISOString(),
                })

              if (coinTxError) {
                console.error("[PAYSTACK] Failed to save coin transaction:", coinTxError)
              } else {
                console.log(`[PAYSTACK] Saved coin transaction for user ${transaction.user_id}`)
              }
            } else {
              console.log(`[PAYSTACK] Coin transaction already exists for reference ${transaction.id}`)
            }
          }
        }

        return NextResponse.json({
          success: true,
          status: "completed",
          coinsAdded: coinsAmount,
          amount: transaction.amount,
        })
      } catch (error) {
        console.error("[PAYSTACK] Verification error:", error)
        return NextResponse.json(
          { error: "Verification error", status: "error" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: false,
      status: transaction.status,
    })
  } catch (error) {
    console.error("[PAYSTACK] Verify endpoint error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
