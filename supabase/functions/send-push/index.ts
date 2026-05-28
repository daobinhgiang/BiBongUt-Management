// Edge Function: send-push
// Triggered by Database Webhook on notifications table INSERT
// Sends push notifications via Expo Push API

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface WebhookPayload {
  type: "INSERT";
  table: "notifications";
  record: {
    id: string;
    family_member_id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    status: string;
    attempts: number;
  };
}

Deno.serve(async (req) => {
  try {
    // Verify webhook secret
    const webhookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET");
    if (!webhookSecret || req.headers.get("x-webhook-secret") !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    if (record.status !== "pending") {
      return Response.json({ skipped: true });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get push token + preferences
    const { data: member } = await supabase
      .from("family_members")
      .select("push_token, notification_prefs")
      .eq("id", record.family_member_id)
      .single();

    if (!member?.push_token) {
      await supabase
        .from("notifications")
        .update({ status: "failed", attempts: record.attempts + 1 })
        .eq("id", record.id);
      return Response.json({ skipped: true, reason: "no_push_token" });
    }

    // Check preference
    const prefs = (member.notification_prefs ?? {}) as Record<string, boolean>;
    if (prefs[record.type] === false) {
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", record.id);
      return Response.json({ skipped: true, reason: "preference_disabled" });
    }

    // Send via Expo Push API
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: member.push_token,
        title: record.title,
        body: record.body,
        data: record.data,
        sound: "default",
        priority: record.type === "streak_at_risk" ? "high" : "default",
        channelId: record.type === "streak_at_risk" ? "urgent" : "default",
      }),
    });

    const result = await res.json();

    if (result.data?.status === "ok") {
      await supabase
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: record.attempts + 1,
        })
        .eq("id", record.id);
      return Response.json({ sent: true });
    }

    console.error("Expo push failed:", result);
    await supabase
      .from("notifications")
      .update({ status: "failed", attempts: record.attempts + 1 })
      .eq("id", record.id);
    return Response.json({ error: result });
  } catch (err) {
    console.error("send-push error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
