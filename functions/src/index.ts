/* eslint-disable */
import * as functions from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

// Brevo (Sendinblue) setup
// In Node 20, fetch is globally available.
declare const fetch: any;

admin.initializeApp();
const db = admin.firestore();

// Read config values safely (from Firebase config or environment)
const BREVO_KEY =
  process.env.BREVO_API_KEY ||
  functions.config().brevo?.key ||
  "";
const BREVO_FROM =
  process.env.BREVO_FROM ||
  functions.config().brevo?.from ||
  "no-reply@scrumdinger.app";
const APP_URL =
  process.env.APP_URL ||
  functions.config().app?.url ||
  "https://scrum-dinger.vercel.app";

// ------------------ Utility: Email Sender ------------------
async function sendEmail(
  to: string[],
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  if (!BREVO_KEY) {
    console.warn("⚠️ Brevo API key not configured. Skipping email send.");
    return;
  }

  try {
    const payload = {
      sender: { name: "ScrumDinger", email: BREVO_FROM },
      to: to.map((email) => ({ email })),
      subject,
      textContent: text,
      ...(html ? { htmlContent: html } : {}),
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("❌ Brevo send failed", res.status, body);
    }
  } catch (err) {
    console.error("❌ Brevo sendEmail error:", err);
  }
}

// ------------------ Firestore Triggers ------------------
export const onScrumCreated = onDocumentCreated(
  {
    document: "scrums/{scrumId}",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 10,
  },
  async (event) => {
    const snap = event.data;
    const data = snap?.data();
    if (!data) return;

    const attendees = Array.isArray(data.attendees) ? data.attendees : [];
    const emails = attendees.map((a: any) => a.email).filter(Boolean);
    if (!emails.length) return;

    const scheduledAt = data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt);
    const whenText = scheduledAt ? scheduledAt.toUTCString() : "TBD";

    const subject = `Scrum Scheduled: ${data.title || "Standup"}`;
    const text = `A scrum has been scheduled for ${whenText}.\n\nTitle: ${data.title || "Standup"}\nTeam: ${data.teamId || ""}\n\nSee your ScrumDinger dashboard for details.`;
    const html = `<p>A scrum has been scheduled for <strong>${whenText}</strong>.</p>
  <p><strong>Title:</strong> ${data.title || "Standup"}</p>
  <p><strong>Team:</strong> ${data.teamId || ""}</p>
  <p>Open the <em>ScrumDinger</em> app to view details and join.</p>`;

    await sendEmail(emails, subject, text, html);
  }
);

export const onTeamInviteCreated = onDocumentCreated(
  {
    document: "teamInvites/{inviteId}",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 10,
  },
  async (event) => {
    const snap = event.data;
    const data = snap?.data();
    if (!data) return;

    const email = data.email;
    const code = data.code;
    const inviter = data.inviter || "A team member";

    const joinUrl = `${APP_URL.replace(/\/$/, "")}/join?code=${encodeURIComponent(code)}`;
    const subject = `${inviter} invited you to join a team on ScrumDinger`;

    const text = `${inviter} invited you to join a team on ScrumDinger.\n\nUse code: ${code}\nOr click: ${joinUrl}\n\nOpen the ScrumDinger app to accept the invite.`;
    const html = `<p>${inviter} invited you to join a team on <strong>ScrumDinger</strong>.</p>
  <p><strong>Invite code:</strong> <code>${code}</code></p>
  <p><a href="${joinUrl}">Accept invite</a></p>`;

    await sendEmail([email], subject, text, html);
  }
);

// ------------------ Callable Functions ------------------
export const acceptInvite = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (req) => {
    const context = req.auth;
    if (!context?.uid)
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");

    const uid = context.uid;
    const code = req.data?.code?.toString()?.toUpperCase?.();
    if (!code)
      throw new functions.https.HttpsError("invalid-argument", "Missing invite code.");

    // Find invite by code
    const q = await db
      .collection("teamInvites")
      .where("code", "==", code)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (q.empty)
      throw new functions.https.HttpsError("not-found", "Invite not found or already used.");

    const inviteDoc = q.docs[0];
    const inviteData: any = inviteDoc.data();

    if (inviteData.expiresAt?.toMillis?.() < Date.now())
      throw new functions.https.HttpsError("failed-precondition", "Invite expired.");

    const teamId = inviteData.teamId;
    const teamRef = db.collection("teams").doc(teamId);

    const userRecord = await admin.auth().getUser(uid);
    const userObj = {
      uid,
      name:
        userRecord.displayName ||
        userRecord.email?.split("@")[0] ||
        "User",
      email: userRecord.email || "",
    };

    await db.runTransaction(async (tx) => {
      const teamSnap = await tx.get(teamRef);
      if (!teamSnap.exists)
        throw new functions.https.HttpsError("not-found", "Team not found.");

      const teamData: any = teamSnap.data();
      const members = teamData.members || [];
      const membersIds = teamData.membersIds || [];

      if (!membersIds.includes(uid)) {
        members.push({ ...userObj, role: "Member" });
        membersIds.push(uid);
        tx.update(teamRef, { members, membersIds });
      }

      tx.update(inviteDoc.ref, {
        used: true,
        usedBy: uid,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { teamId };
  }
);

export const testSendEmail = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (req) => {
    const auth = req.auth;
    if (!auth?.uid)
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");

    const toRaw = req.data?.to;
    const to = Array.isArray(toRaw)
      ? toRaw
      : typeof toRaw === "string"
      ? [toRaw]
      : [];

    if (!to.length)
      throw new functions.https.HttpsError("invalid-argument", 'Missing "to" email.');

    const subject =
      req.data?.subject || "Test email from ScrumDinger";
    const text =
      req.data?.text || "This is a test email from your ScrumDinger functions.";
    const html = req.data?.html;

    await sendEmail(to, subject, text, html);
    return { ok: true, sentTo: to };
  }
);

// ------------------ Scheduler ------------------
export const scheduledReminder = onSchedule(
  {
    schedule: "every 5 minutes",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const in30 = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60 * 1000);
    const in10 = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);

    const batch = db.batch();

    const q30 = await db
      .collection("scrums")
      .where("scheduledAt", "<=", in30)
      .where("scheduledAt", ">=", now)
      .where("remindersSent.30", "==", false)
      .get();

    for (const docSnap of q30.docs) {
      const data = docSnap.data();
      const attendees = Array.isArray(data.attendees) ? data.attendees : [];
      const emails = attendees.map((a: any) => a.email).filter(Boolean);
      if (!emails.length) continue;

      const whenText = data.scheduledAt?.toDate?.()?.toUTCString?.() || "soon";
      const subject = `Reminder (30m): Scrum starting at ${whenText}`;
      const text = `Reminder: your scrum titled "${data.title || "Standup"}" starts at ${whenText}.`;
      await sendEmail(emails, subject, text);
      batch.update(docSnap.ref, { ["remindersSent.30"]: true });
    }

    const q10 = await db
      .collection("scrums")
      .where("scheduledAt", "<=", in10)
      .where("scheduledAt", ">=", now)
      .where("remindersSent.10", "==", false)
      .get();

    for (const docSnap of q10.docs) {
      const data = docSnap.data();
      const attendees = Array.isArray(data.attendees) ? data.attendees : [];
      const emails = attendees.map((a: any) => a.email).filter(Boolean);
      if (!emails.length) continue;

      const whenText = data.scheduledAt?.toDate?.()?.toUTCString?.() || "soon";
      const subject = `Reminder (10m): Scrum starting at ${whenText}`;
      const text = `Reminder: your scrum titled "${data.title || "Standup"}" starts at ${whenText}.`;
      await sendEmail(emails, subject, text);
      batch.update(docSnap.ref, { ["remindersSent.10"]: true });
    }

    await batch.commit();
  }
);