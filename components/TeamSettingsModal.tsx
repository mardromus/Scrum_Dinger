import React, { useState } from 'react';
import { Team, TeamMember, TeamMemberRole } from '../types';

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onInviteMember: (teamId: string, email: string) => void;
  onUpdateMemberRole: (teamId: string, memberId: string, newRole: TeamMemberRole) => void;
  onRemoveMember: (teamId: string, memberId: string) => void;
}

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({ isOpen, onClose, team, onInviteMember, onUpdateMemberRole, onRemoveMember }) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
    if (team && inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      if (team.members.some(m => m.email === inviteEmail)) {
        alert('This user is already a member of the team.');
        return;
      }
      onInviteMember(team.id, inviteEmail);
      setInviteEmail('');
    } else {
      alert("Please enter a valid email address.");
    }
  };
  
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">Manage '{team.name}' Team</h2>
        
        {/* Invite Members Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Invite Members</h3>
          <div className="flex items-center space-x-2 p-2 bg-light-bg dark:bg-dark-bg rounded-md border border-light-border dark:border-dark-border">
            <input
              type="email"
              placeholder="new.member@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-grow bg-transparent focus:outline-none px-2"
            />
            <button onClick={handleInvite} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-secondary text-sm">Send Invite</button>
          </div>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
            You can also invite members via a <button className="text-brand-secondary underline" onClick={() => alert('Feature coming soon!')}>team link</button> or <button className="text-brand-secondary underline" onClick={() => alert('Feature coming soon!')}>invite code</button>.
          </p>
        </div>

        {/* Members List Section */}
        <div className="flex-grow overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3">Team Members ({team.members.length})</h3>
          <ul className="space-y-3">
            {team.members.map(member => (
              <li key={member.uid} className="flex items-center justify-between bg-light-bg dark:bg-dark-bg p-3 rounded-md">
                <div className="flex items-center">
                  <img src={`https://i.pravatar.cc/40?u=${member.email}`} alt={member.name} className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                   <select 
                     value={member.role}
                     onChange={(e) => onUpdateMemberRole(team.id, member.uid, e.target.value as TeamMemberRole)}
                     className="bg-transparent border border-light-border dark:border-dark-border rounded-md px-2 py-1 text-sm focus:ring-brand-primary focus:border-brand-primary"
                   >
                     <option>Scrum Master</option>
                     <option>Member</option>
                     <option>Observer</option>
                   </select>
                   <button onClick={() => onRemoveMember(team.id, member.uid)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">&times;</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-light-border dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-light-text-primary dark:text-dark-text-primary font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};