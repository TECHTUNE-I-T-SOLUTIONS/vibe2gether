import { getServerSession } from "next-auth/next";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { redemptionType, coinsAmount, selectedProductId } = body;

    if (!redemptionType || !coinsAmount) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, coins_balance, is_premium")
      .eq("email", session.user.email)
      .single();

    if (userError || !user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has enough coins
    if (user.coins_balance < coinsAmount) {
      return Response.json(
        { success: false, error: "Insufficient coins" },
        { status: 400 }
      );
    }

    // Check if user is already premium (for premium membership)
    if (redemptionType === "premium" && user.is_premium) {
      return Response.json(
        { success: false, error: "User is already premium" },
        { status: 400 }
      );
    }

    // Calculate USD, NGN, and XAF amounts
    const amountUsd = coinsAmount / 500;
    const amountNgn = amountUsd * 1450;
    const amountXaf = amountUsd * 585.48;

    let result: any = null;

    // Handle different redemption types
    if (redemptionType === "premium") {
      // Create coin premium subscription
      const { data, error } = await supabase
        .from("coin_premium_subscriptions")
        .insert([
          {
            user_id: user.id,
            coins_spent: coinsAmount,
            plan: "premium",
            status: "active",
            expires_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            features: ["messaging", "visibility", "profile_boost"],
            auto_renew: false,
          },
        ])
        .select()
        .single();

      if (error) {
        return Response.json(
          { success: false, error: "Failed to create premium subscription" },
          { status: 500 }
        );
      }

      result = data;
    } else if (redemptionType === "profile_boost") {
      // Create profile boost
      const { data, error } = await supabase
        .from("profile_boosts")
        .insert([
          {
            user_id: user.id,
            coins_spent: coinsAmount,
            status: "active",
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            boost_level: 1,
            views_count: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        return Response.json(
          { success: false, error: "Failed to create profile boost" },
          { status: 500 }
        );
      }

      result = data;
    } else if (redemptionType === "featured_product") {
      if (!selectedProductId) {
        return Response.json(
          { success: false, error: "Product ID required for featured product" },
          { status: 400 }
        );
      }

      // Check if product is already featured
      const { data: existingFeature } = await supabase
        .from("product_features")
        .select("id")
        .eq("product_id", selectedProductId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (existingFeature) {
        return Response.json(
          { success: false, error: "This product is already featured" },
          { status: 400 }
        );
      }

      // Create product feature
      const { data, error } = await supabase
        .from("product_features")
        .insert([
          {
            product_id: selectedProductId,
            user_id: user.id,
            coins_spent: coinsAmount,
            status: "active",
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            feature_type: "premium",
            views_boost_count: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        return Response.json(
          { success: false, error: "Failed to create product feature" },
          { status: 500 }
        );
      }

      result = data;
    } else if (redemptionType === "gift_card") {
      // Create gift card
      const giftCardCode = `GC-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("coin_gift_cards")
        .insert([
          {
            issued_by_user_id: user.id,
            coins_spent: coinsAmount,
            gift_card_value: 10, // $10 USD
            gift_card_code: giftCardCode,
            status: "active",
            expires_at: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return Response.json(
          { success: false, error: "Failed to create gift card" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      return Response.json(
        { success: false, error: "Invalid redemption type" },
        { status: 400 }
      );
    }

    // Deduct coins from user balance
    const newBalance = user.coins_balance - coinsAmount;
    const updateData: any = { coins_balance: newBalance };
    
    // If premium redemption, update is_premium status
    if (redemptionType === "premium") {
      updateData.is_premium = true;
    }
    
    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      return Response.json(
        { success: false, error: "Failed to update coin balance" },
        { status: 500 }
      );
    }

    // Create coin transaction record
    await supabase.from("coin_transactions").insert([
      {
        user_id: user.id,
        amount: -coinsAmount,
        transaction_type: `redeemed_${redemptionType}`,
        description: `Redeemed ${coinsAmount} coins for ${redemptionType}`,
        reference_type: redemptionType,
        balance_after: newBalance,
      },
    ]);

    // Create coin redemption record
    await supabase.from("coin_redemptions").insert([
      {
        user_id: user.id,
        redemption_type: redemptionType,
        coins_amount: coinsAmount,
        amount_usd: amountUsd,
        amount_ngn: amountNgn,
        status: "active",
        reference_id: result?.id,
        expires_at:
          redemptionType === "premium"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : redemptionType === "profile_boost"
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    // Create notification for user
    await supabase.from("notifications").insert([
      {
        user_id: user.id,
        type: "coin_redeemed",
        title: `${redemptionType.replace(/_/g, " ")} Redeemed`,
        message: `You have successfully redeemed ${coinsAmount} coins for ${redemptionType.replace(/_/g, " ")}`,
      },
    ]);

    return Response.json({
      success: true,
      message: "Coins redeemed successfully",
      newBalance,
      redemption: result,
    });
  } catch (error) {
    console.error("Redeem coins error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
