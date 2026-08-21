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
 * Dispatches a notification event to QStash asynchronously.
 * QStash delivers the payload to the Next.js worker with 5 exponential backoff retries.
 */
export async function queueNotification(payload: NotificationQueuePayload): Promise<void> {
  try {
    if (!payload.recipientIds || payload.recipientIds.length === 0) {
      return;
    }

    if (!qstashClient) {
      console.warn("[⚠️ QSTASH]: QSTASH_TOKEN not configured. Skipping queue dispatch.");
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://provenworld.com";
    const webhookUrl = `${frontendUrl.replace(/\/$/, '')}/api/webhooks/qstash/notification`;

    const res = await qstashClient.publishJSON({
      url: webhookUrl,
      body: payload,
      retries: 5, // 5 exponential backoff retries (zero loss guarantee)
    });

    console.log(`[🚀 QSTASH QUEUED]: Message ${payload.messageId} queued for ${payload.recipientIds.length} recipient(s) (QStash ID: ${res.messageId})`);
  } catch (error: any) {
    // Non-blocking: Catch and log so that chat persistence is never interrupted
    console.error("[🚨 QSTASH PUBLISH ERROR]:", error.message);
  }
}
