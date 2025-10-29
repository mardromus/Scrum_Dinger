
import React from 'react';
import { Scrum, User } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { UsersIcon } from '../context/UsersIcon';

interface DashboardProps {
  user: User;
  scrums: Scrum[];
  onScheduleScrum: () => void;
  onStartScrum: (scrumId: string) => void;
}

const ScrumCard: React.FC<{ scrum: Scrum; onStart: () => void }> = ({ scrum, onStart }) => (
  <div className="bg-dark-surface rounded-lg shadow-lg p-6 flex flex-col justify-between hover:shadow-brand-primary/20 hover:border-brand-primary border border-transparent transition-all duration-300 transform hover:-translate-y-1">
    <div>
      <h3 className="text-xl font-bold text-dark-text-primary">{scrum.title}</h3>
      <p className="text-sm text-dark-text-secondary mt-1">
        Scheduled for: {scrum.scheduledAt.toLocaleTimeString()}
      </p>
      <div className="mt-4 space-y-2 text-dark-text-secondary">
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

export const Dashboard: React.FC<DashboardProps> = ({ user, scrums, onScheduleScrum, onStartScrum }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Your Scrums</h2>
        <button
          onClick={onScheduleScrum}
          className="px-6 py-2 bg-brand-secondary hover:bg-purple-700 rounded-md text-white font-semibold transition-colors shadow-lg"
        >
          + Schedule New Scrum
        </button>
      </div>
      {scrums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scrums.map(scrum => (
            <ScrumCard key={scrum.id} scrum={scrum} onStart={() => onStartScrum(scrum.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-dark-surface rounded-lg">
          <h3 className="text-xl text-dark-text-primary">No scrums scheduled yet.</h3>
          <p className="text-dark-text-secondary mt-2">Ready to kick off your day? Schedule your first scrum!</p>
          <button
            onClick={onScheduleScrum}
            className="mt-6 px-6 py-2 bg-brand-secondary hover:bg-purple-700 rounded-md text-white font-semibold transition-colors shadow-lg"
          >
            Schedule a Scrum
          </button>
        </div>
      )}
    </div>
  );
};