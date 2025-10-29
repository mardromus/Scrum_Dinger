import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();
const db = admin.firestore();

// Configure SendGrid API key from functions config or env
const SENDGRID_KEY = (functions.config() && functions.config().sendgrid && functions.config().sendgrid.key) || process.env.SENDGRID_API_KEY;
const FROM_EMAIL = (functions.config() && functions.config().sendgrid && functions.config().sendgrid.from) || process.env.SENDGRID_FROM;

if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
} else {
  console.warn('SendGrid key not found. Emails will fail until configured.');
}

async function sendEmail(to: string[], subject: string, text: string, html?: string) {
  if (!SENDGRID_KEY) {
    console.warn('Skipping sendEmail because SENDGRID_KEY is not set');
    return;
  }
  const msg: any = {
    to,
    from: FROM_EMAIL || 'no-reply@example.com',
    subject,
    text,
  };
  if (html) msg.html = html;
  try {
    await sgMail.send(msg);
  } catch (err: any) {
    console.error('sendEmail error', err?.response?.body || err.message || err);
  }
}

/**
 * Trigger: when a scrum doc is created, send a scheduling email to attendees.
 * Expected scrum doc shape: { title, attendees: [{email,name}], scheduledAt: Timestamp, createdBy }
 */
export const onScrumCreated = functions.firestore.document('scrums/{scrumId}').onCreate(async (snap: functions.firestore.DocumentSnapshot, ctx: functions.EventContext) => {
  const data = snap.data();
  if (!data) return;
  const attendees = Array.isArray(data.attendees) ? data.attendees : [];
  const emails = attendees.map((a: any) => a.email).filter(Boolean);
  if (!emails.length) return;

  const scheduledAt = data.scheduledAt ? data.scheduledAt.toDate?.() ?? new Date(data.scheduledAt) : null;
  const whenText = scheduledAt ? scheduledAt.toUTCString() : 'TBD';

  const subject = `Scrum Scheduled: ${data.title || 'Standup'}`;
  const text = `A scrum has been scheduled for ${whenText}.

Title: ${data.title || 'Standup'}
Team: ${data.teamId || ''}

See your ScrumDinger dashboard for details.`;

  const html = `<p>A scrum has been scheduled for <strong>${whenText}</strong>.</p>
  <p><strong>Title:</strong> ${data.title || 'Standup'}</p>
  <p><strong>Team:</strong> ${data.teamId || ''}</p>
  <p>Open the <em>ScrumDinger</em> app to view details and join.</p>`;

  await sendEmail(emails, subject, text, html);
});

/**
 * When a team invite is created, send an invite email containing the code and a join link.
 * Expects teamInvites doc to contain { teamId, email, code, inviter }
 */
export const onTeamInviteCreated = functions.firestore.document('teamInvites/{inviteId}').onCreate(async (snap: functions.firestore.DocumentSnapshot, ctx: functions.EventContext) => {
  const data = snap.data();
  if (!data) return;
  const email = data.email;
  const code = data.code;
  const inviter = data.inviter || 'A team member';
  const teamId = data.teamId;

  const subject = `${inviter} invited you to join a team on ScrumDinger`;
  const joinUrl = `https://your-app-domain.example.com/join?code=${code}`; // replace with your app URL
  const text = `${inviter} invited you to join a team on ScrumDinger.

Use code: ${code}
Or click: ${joinUrl}

Open the ScrumDinger app to accept the invite.`;
  const html = `<p>${inviter} invited you to join a team on <strong>ScrumDinger</strong>.</p>
  <p><strong>Invite code:</strong> <code>${code}</code></p>
  <p><a href="${joinUrl}">Accept invite</a></p>`;

  await sendEmail([email], subject, text, html);
});

/**
 * Scheduled function: runs every 5 minutes and sends reminders for scrums scheduled within the next 30 and 10 minutes.
 * Uses `remindersSent` map on the document to avoid duplicate sends (fields '30' and '10').
 */
export const scheduledReminder = functions.pubsub.schedule('every 5 minutes').onRun(async (context: functions.EventContext) => {
  const now = admin.firestore.Timestamp.now();
  const in30 = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60 * 1000);
  const in10 = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);

  // Send 30-minute reminders
  const q30 = await db.collection('scrums')
    .where('scheduledAt', '<=', in30)
    .where('scheduledAt', '>=', now)
    .where('remindersSent.30', '==', false)
    .get();

  const batch = db.batch();

  for (const docSnap of q30.docs) {
    const data = docSnap.data();
    const attendees = Array.isArray(data.attendees) ? data.attendees : [];
    const emails = attendees.map((a: any) => a.email).filter(Boolean);
    if (!emails.length) continue;

    const scheduledAt = data.scheduledAt ? data.scheduledAt.toDate?.() ?? new Date(data.scheduledAt) : null;
    const whenText = scheduledAt ? scheduledAt.toUTCString() : 'soon';

    const subject = `Reminder (30m): Scrum starting at ${whenText}`;
    const text = `Reminder: your scrum titled "${data.title || 'Standup'}" is scheduled to start at ${whenText} (in ~30 minutes).

Open the ScrumDinger app to join.`;

    await sendEmail(emails, subject, text);
    batch.update(docSnap.ref, { ['remindersSent.30']: true });
  }

  // Send 10-minute reminders
  const q10 = await db.collection('scrums')
    .where('scheduledAt', '<=', in10)
    .where('scheduledAt', '>=', now)
    .where('remindersSent.10', '==', false)
    .get();

  for (const docSnap of q10.docs) {
    const data = docSnap.data();
    const attendees = Array.isArray(data.attendees) ? data.attendees : [];
    const emails = attendees.map((a: any) => a.email).filter(Boolean);
    if (!emails.length) continue;

    const scheduledAt = data.scheduledAt ? data.scheduledAt.toDate?.() ?? new Date(data.scheduledAt) : null;
    const whenText = scheduledAt ? scheduledAt.toUTCString() : 'soon';

    const subject = `Reminder (10m): Scrum starting at ${whenText}`;
    const text = `Reminder: your scrum titled "${data.title || 'Standup'}" is scheduled to start at ${whenText} (in ~10 minutes).

Open the ScrumDinger app to join.`;

    await sendEmail(emails, subject, text);
    batch.update(docSnap.ref, { ['remindersSent.10']: true });
  }

  await batch.commit();
  return null;
});
