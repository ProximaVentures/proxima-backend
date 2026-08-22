import { Client } from "@upstash/qstash";

const qstashToken = process.env.QSTASH_TOKEN;

// Initialize QStash client if token is provided
export const qstashClient = qstashToken
  ? new Client({ token: qstashToken })
  : null;

export interface NotificationQueuePayload {
  type: "NEW_MESSAGE" | "SPRINT_UPDATE" | "MEETING_SCHEDULED" | "TASK_ASSIGNED" | "SYSTEM";
  messageId: string;
  conversationId?: string;
  senderId?: string | null;
  senderName: string;
  recipientIds: string[];
  title: string;
  body: string;
  deepLink?: string;
}

/**
 * Dispatches a notification event.
 * 
 * In production: publishes to QStash cloud, which delivers to the Next.js webhook
 *   with 5 exponential backoff retries and HMAC signature verification.
 * 
 * In development (localhost): calls the Next.js webhook directly since QStash
 *   cannot reach localhost from the internet.
 */
export async function queueNotification(payload: NotificationQueuePayload): Promise<void> {
  try {
    if (!payload.recipientIds || payload.recipientIds.length === 0) {
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://provenworld.com";
    const webhookUrl = `${frontendUrl.replace(/\/$/, '')}/api/webhooks/qstash/notification`;
    const isLocalDev = frontendUrl.includes("localhost") || frontendUrl.includes("127.0.0.1");

    if (isLocalDev) {
      // LOCAL DEV: Call the Next.js webhook directly (QStash can't reach localhost)
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        console.log(`[🚀 LOCAL PUSH DISPATCHED]: Message ${payload.messageId} → ${payload.recipientIds.length} recipient(s) (Status: ${res.status})`, data);
      } catch (fetchErr: any) {
        console.error("[⚠️ LOCAL WEBHOOK CALL FAILED]:", fetchErr.message);
      }
      return;
    }

    // PRODUCTION: Publish to QStash cloud for durable delivery
    if (!qstashClient) {
      console.warn("[⚠️ QSTASH]: QSTASH_TOKEN not configured. Skipping queue dispatch.");
      return;
    }

    const res = await qstashClient.publishJSON({
      url: webhookUrl,
      body: payload,
      retries: 5,
    });

    console.log(`[🚀 QSTASH QUEUED]: Message ${payload.messageId} queued for ${payload.recipientIds.length} recipient(s) (QStash ID: ${res.messageId})`);
  } catch (error: any) {
    // Non-blocking: Catch and log so that chat persistence is never interrupted
    console.error("[🚨 QSTASH PUBLISH ERROR]:", error.message);
  }
}
