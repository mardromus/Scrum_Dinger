
import React from 'react';
import { Scrum, Team } from '../types';
import { ClockIcon } from '../components/icons/ClockIcon';
import { UsersIcon } from '../context/UsersIcon';

interface DashboardProps {
  scrums: Scrum[];
  onStartScrum: (scrumId: string) => void;
  teams: Team[];
  selectedTeamId: string | null;
}

const ScrumCard: React.FC<{ scrum: Scrum; onStart: () => void; teamName?: string }> = ({ scrum, onStart, teamName }) => (
  <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-lg p-6 flex flex-col justify-between hover:shadow-brand-primary/20 hover:ring-2 hover:ring-brand-primary transition-all duration-300 transform hover:-translate-y-1">
    <div>
      {teamName && <p className="text-xs font-bold uppercase text-brand-secondary mb-2 tracking-wider">{teamName}</p>}
      <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{scrum.title}</h3>
      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
        Scheduled for: {scrum.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <div className="mt-4 space-y-2 text-light-text-secondary dark:text-dark-text-secondary">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5" />
          <span>{scrum.durationMinutes} min total / {scrum.timePerSpeakerSeconds}s per speaker</span>
        </div>
        <div className="flex items-center space-x-2">
          <UsersIcon className="w-5 h-5" />
          <span>{scrum.attendees.length} attendees</span>
        </div>
      </div>
    </div>
    <div className="mt-6">
      <button
        onClick={onStart}
        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition-colors"
      >
        Start Meeting
      </button>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ scrums, onStartScrum, teams, selectedTeamId }) => {
  return (
    <div>
      {scrums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {scrums.map(scrum => {
            const teamName = selectedTeamId === null 
              ? teams.find(t => t.id === scrum.teamId)?.name 
              : undefined;
            return <ScrumCard key={scrum.id} scrum={scrum} onStart={() => onStartScrum(scrum.id)} teamName={teamName} />
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-light-surface dark:bg-dark-surface rounded-lg">
          <h3 className="text-xl text-light-text-primary dark:text-dark-text-primary">No upcoming scrums.</h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">Looks like your schedule is clear! Ready to plan the next one?</p>
        </div>
      )}
    </div>
  );
};
