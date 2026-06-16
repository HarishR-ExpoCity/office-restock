import type { RequestStatus } from "./types";

const STATUS_LABEL: Record<RequestStatus, string> = {
  low: "Running low",
  out: "Out of stock",
  new_item: "New item request",
};

const STATUS_COLOR: Record<RequestStatus, string> = {
  low: "warning",
  out: "attention",
  new_item: "accent",
};

interface RestockNotification {
  itemName: string;
  status: RequestStatus;
  note?: string | null;
  reporter?: string | null;
  dashboardUrl?: string;
}

/**
 * Sends a restock notification to the office admin via a Power Automate
 * "Workflow". The workflow is triggered by an HTTP POST (the
 * "When a Teams webhook request is received" trigger) and is configured to
 * post the Adaptive Card as a direct message to the admin (Flow bot -> chat).
 *
 * The TEAMS_WORKFLOW_URL is a server-side secret. This must only run on the
 * server (it is called from the /api/requests route handler).
 */
export async function notifyAdmin(payload: RestockNotification): Promise<void> {
  const url = process.env.TEAMS_WORKFLOW_URL;
  if (!url) {
    console.warn("[teams] TEAMS_WORKFLOW_URL not set — skipping notification.");
    return;
  }

  const message = buildCardMessage(payload);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Teams workflow POST failed: ${res.status} ${body}`);
  }
}

// Builds the full message envelope the "When a Teams webhook request is
// received" trigger expects: a `type: "message"` object whose attachments wrap
// the Adaptive Card. Do NOT reduce this to a bare AdaptiveCard — the Workflows
// webhook rejects that with a 400. The flow then maps attachments[0].content
// into its "Post card in a chat or channel" action.
function buildCardMessage(p: RestockNotification) {
  const facts: { title: string; value: string }[] = [
    { title: "Item", value: p.itemName },
    { title: "Status", value: STATUS_LABEL[p.status] },
  ];
  if (p.reporter) facts.push({ title: "Reported by", value: p.reporter });
  if (p.note) facts.push({ title: "Note", value: p.note });

  const body: unknown[] = [
    {
      type: "TextBlock",
      size: "Medium",
      weight: "Bolder",
      text: "🧴 Office restock request",
      color: STATUS_COLOR[p.status],
    },
    { type: "FactSet", facts },
  ];

  const actions = p.dashboardUrl
    ? [
        {
          type: "Action.OpenUrl",
          title: "Open dashboard",
          url: p.dashboardUrl,
        },
      ]
    : [];

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          // 1.2 is the highest version the Teams mobile app renders reliably;
          // this card only uses 1.0–1.2 elements (TextBlock, FactSet, OpenUrl).
          version: "1.2",
          body,
          actions,
        },
      },
    ],
  };
}
