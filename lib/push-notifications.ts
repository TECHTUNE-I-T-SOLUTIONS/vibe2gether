import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Configure web push with the keys provided
export function initializePushNotifications() {
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:vibe2gether@gmail.com"
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ""

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  }
}

export interface PushNotificationPayload {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  eventType?: string
  data?: Record<string, string>
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
  logNotification = true
) {
  try {
    const supabase = await createClient()

    // Get all active push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (subError) {
      console.error("Error fetching push subscriptions:", subError)
      return { success: false, error: "Failed to fetch subscriptions" }
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No active push subscriptions for user ${userId}`)
      return { success: false, error: "No active subscriptions" }
    }

    // Prepare notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body || "",
      icon: payload.icon || "/logo.png",
      badge: payload.badge || "/badge-icon.png",
      tag: payload.tag || "default",
      ...(payload.url && { data: { url: payload.url, ...payload.data } }),
    }

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    // Send to all subscriptions
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth_key,
              p256dh: subscription.p256dh_key,
            },
          },
          JSON.stringify(notificationPayload)
        )

        // Update last_used_at
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", subscription.id)

        successCount++

        // Log successful notification
        if (logNotification) {
          await supabase.from("push_notification_logs").insert({
            user_id: userId,
            subscription_id: subscription.id,
            title: payload.title,
            body: payload.body,
            icon: payload.icon,
            badge: payload.badge,
            tag: payload.tag,
            event_type: payload.eventType,
            status: "sent",
            sent_at: new Date().toISOString(),
          })
        }
      } catch (error: any) {
        failureCount++
        const errorMessage = error.message || "Unknown error"
        errors.push(errorMessage)

        // Log failed notification
        if (logNotification) {
          await supabase.from("push_notification_logs").insert({
            user_id: userId,
            subscription_id: subscription.id,
            title: payload.title,
            body: payload.body,
            icon: payload.icon,
            badge: payload.badge,
            tag: payload.tag,
            event_type: payload.eventType,
            status: "failed",
            error_message: errorMessage,
            sent_at: new Date().toISOString(),
          })
        }

        // If error is 410 or 404, subscription is invalid
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", subscription.id)
        }
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error("Error sending push notification:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

/**
 * Send broadcast notification to multiple users
 */
export async function broadcastPushNotification(
  userIds: string[],
  payload: PushNotificationPayload,
  logNotification = true
) {
  const results = await Promise.all(
    userIds.map((userId) => sendPushNotification(userId, payload, logNotification))
  )

  return {
    total: userIds.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    errors: results
      .filter((r) => r.error)
      .map((r) => r.error)
      .filter(Boolean),
  }
}

/**
 * Specific notification builders
 */

export async function notifyNewMessage(
  recipientUserId: string,
  senderName: string,
  senderId: string,
  messagePreview: string
) {
  return sendPushNotification(recipientUserId, {
    title: `New message from ${senderName}`,
    body: messagePreview.substring(0, 100),
    icon: "/notification-icons/message.png",
    tag: "message",
    eventType: "message",
    url: `/dashboard/messages?userId=${senderId}`,
  })
}

export async function notifyNewMatch(
  userId: string,
  matchName: string,
  matchId: string
) {
  return sendPushNotification(userId, {
    title: "New Match!",
    body: `You matched with ${matchName}!`,
    icon: "/notification-icons/match.png",
    tag: "match",
    eventType: "match",
    url: `/dashboard/matches`,
  })
}

export async function notifyProductListed(
  userId: string,
  productName: string,
  productId: string
) {
  return sendPushNotification(userId, {
    title: "New Product Listed",
    body: productName,
    icon: "/notification-icons/product.png",
    tag: "product",
    eventType: "product_listed",
    url: `/dashboard/marketplace/${productId}`,
  })
}

export async function notifyEventCreated(
  userId: string,
  eventName: string,
  eventId: string
) {
  return sendPushNotification(userId, {
    title: "New Event",
    body: eventName,
    icon: "/notification-icons/event.png",
    tag: "event",
    eventType: "event_created",
    url: `/dashboard/events/${eventId}`,
  })
}

export async function notifyPostLiked(
  userId: string,
  likerName: string,
  postId: string
) {
  return sendPushNotification(userId, {
    title: "Your post was liked",
    body: `${likerName} liked your post`,
    icon: "/notification-icons/like.png",
    tag: "like",
    eventType: "like",
    url: `/dashboard/blog/${postId}`,
  })
}

export async function notifyNewFollower(
  userId: string,
  followerName: string,
  followerId: string
) {
  return sendPushNotification(userId, {
    title: "New Follower",
    body: `${followerName} started following you`,
    icon: "/notification-icons/follow.png",
    tag: "follow",
    eventType: "follow",
    url: `/profile/${followerId}`,
  })
}

export async function notifyEventApplication(
  organizerId: string,
  applicantName: string,
  eventName: string,
  eventId: string
) {
  return sendPushNotification(organizerId, {
    title: "New Event Application",
    body: `${applicantName} applied for ${eventName}`,
    icon: "/notification-icons/application.png",
    tag: "application",
    eventType: "event_application",
    url: `/dashboard/events/${eventId}`,
  })
}

// Initialize on module load
initializePushNotifications()
