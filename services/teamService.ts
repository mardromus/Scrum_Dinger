import { db, auth } from './firebase';
import { collection, doc, setDoc, addDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, runTransaction, getDocs, query, where } from 'firebase/firestore';

export interface TeamInput {
  name: string;
  members: { uid: string; name: string; email: string; role: string }[];
}

/** Create a new team document with members and membersIds for queries */
export async function createTeam(teamInput: TeamInput) {
  const id = `team-${Date.now()}-${Math.random()}`;
  const docRef = doc(db, 'teams', id);
  const membersIds = teamInput.members.map(m => m.uid);
  await setDoc(docRef, {
    id,
    name: teamInput.name,
    members: teamInput.members,
    membersIds,
    createdBy: auth.currentUser?.uid || null,
    createdAt: serverTimestamp(),
  });
  return { id, ...teamInput, membersIds };
}

/** Create an invite for a team. Returns the invite doc id and code. */
export async function inviteMember(teamId: string, email: string, inviterName?: string) {
  const code = Math.random().toString(36).slice(2, 9).toUpperCase();
  const invitesRef = collection(db, 'teamInvites');
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const inviteDoc = await addDoc(invitesRef, {
    teamId,
    email,
    code,
    inviter: inviterName || null,
    createdBy: auth.currentUser?.uid || null,
    createdAt: serverTimestamp(),
    expiresAt,
    used: false,
  });
  return { id: inviteDoc.id, code };
}

/** Accept an invite by code: finds invite, validates expiry, and adds user to the team */
export async function acceptInvite(code: string, user: { uid: string; name: string; email: string }) {
  // Find invite doc by code
  const invitesRef = collection(db, 'teamInvites');
  const q = query(invitesRef, where('code', '==', code));
  const qs = await getDocs(q);
  if (qs.empty) throw new Error('Invite not found');
  const inviteDoc = qs.docs[0];
  const inviteData: any = inviteDoc.data();
  if (inviteData.used) throw new Error('Invite already used');
  if (inviteData.expiresAt && typeof inviteData.expiresAt.toMillis === 'function' && inviteData.expiresAt.toMillis() < Date.now()) throw new Error('Invite expired');

  // Use transaction to add member and mark invite used
  return await runTransaction(db, async (tx) => {
    const teamRef = doc(db, 'teams', inviteData.teamId);
    const teamSnap = await tx.get(teamRef as any);
    if (!teamSnap.exists()) throw new Error('Team not found');
    const teamData: any = teamSnap.data();
    const newMember = { uid: user.uid, name: user.name, email: user.email, role: 'Member' };
    const updatedMembers = [...(teamData.members || []), newMember];
    const updatedMembersIds = Array.from(new Set([...(teamData.membersIds || []), user.uid]));

    tx.update(teamRef as any, { members: updatedMembers, membersIds: updatedMembersIds });
    const inviteRef = doc(db, 'teamInvites', inviteDoc.id);
    tx.update(inviteRef as any, { used: true, usedBy: user.uid, usedAt: serverTimestamp() });
    return { teamId: inviteData.teamId };
  });
}

/** Update a member's role in a team */
export async function updateMemberRole(teamId: string, memberUid: string, newRole: string) {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error('Team not found');
  const data: any = teamSnap.data();
  const newMembers = (data.members || []).map((m: any) => m.uid === memberUid ? { ...m, role: newRole } : m);
  await updateDoc(teamRef, { members: newMembers });
}

/** Remove a member from a team */
export async function removeMember(teamId: string, memberUid: string) {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error('Team not found');
  const data: any = teamSnap.data();
  const newMembers = (data.members || []).filter((m: any) => m.uid !== memberUid);
  const newMembersIds = (data.membersIds || []).filter((id: string) => id !== memberUid);
  await updateDoc(teamRef, { members: newMembers, membersIds: newMembersIds });
}

export default {
  createTeam,
  inviteMember,
  acceptInvite,
  updateMemberRole,
  removeMember,
};
