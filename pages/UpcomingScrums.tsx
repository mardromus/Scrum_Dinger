
import React from 'react';
import { Scrum, Team } from '../types';
import { ClockIcon } from '../components/icons/ClockIcon';
import { UsersIcon } from '../context/UsersIcon';

interface UpcomingScrumsProps {
  scrums: Scrum[];
  onStartScrum: (scrumId: string) => void;
  teams: Team[];
  selectedTeamId: string | null;
}

export const UpcomingScrums: React.FC<UpcomingScrumsProps> = ({ scrums, onStartScrum, teams, selectedTeamId }) => {
  return (
    <div className="space-y-4">
      {scrums.length > 0 ? (
        scrums
          .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
          .map(scrum => {
            const teamName = selectedTeamId === null 
              ? teams.find(t => t.id === scrum.teamId)?.name 
              : undefined;

            return (
              <div key={scrum.id} className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-grow">
                  {teamName && <p className="text-xs font-bold uppercase text-brand-secondary mb-1 tracking-wider">{teamName}</p>}
                  <h3 className="text-lg font-bold">{scrum.title}</h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {scrum.scheduledAt.toLocaleString()}
                  </p>
                  <div className="flex space-x-4 mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{scrum.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{scrum.attendees.length} attendees</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onStartScrum(scrum.id)}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors w-full sm:w-auto flex-shrink-0"
                >
                  Start
                </button>
              </div>
            )
          })
      ) : (
        <div className="text-center py-16 bg-light-surface dark:bg-dark-surface rounded-lg">
          <h3 className="text-xl">No upcoming scrums.</h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">Your schedule is clear!</p>
        </div>
      )}
    </div>
  );
};
