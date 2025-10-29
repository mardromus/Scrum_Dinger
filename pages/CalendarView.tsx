import React, { useState } from 'react';
import { Scrum, Team } from '../types';

interface CalendarViewProps {
  scrums: Scrum[];
  onStartScrum: (scrumId: string) => void;
  teams: Team[];
  selectedTeamId: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ scrums, onStartScrum, teams, selectedTeamId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  // Grid view logic
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="border border-light-border dark:border-dark-border rounded-md"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const scrumsOnDay = scrums.filter(
      (s) => new Date(s.scheduledAt).toDateString() === date.toDateString()
    );

    calendarDays.push(
      <div key={day} className="border border-light-border dark:border-dark-border p-2 rounded-md min-h-[120px] flex flex-col">
        <span className="font-bold">{day}</span>
        <div className="mt-1 space-y-1 overflow-y-auto text-xs">
          {scrumsOnDay.map(scrum => {
            const isJoinable = scrum.status !== 'FINISHED';
            const teamName = selectedTeamId === null ? teams.find(t => t.id === scrum.teamId)?.name : undefined;
            const titleText = teamName ? `${scrum.title} (Team: ${teamName})` : scrum.title;

            return (
              <div
                key={scrum.id}
                onClick={() => isJoinable && onStartScrum(scrum.id)}
                className={`p-1 rounded truncate ${
                  isJoinable
                    ? 'bg-brand-primary/20 text-brand-primary cursor-pointer hover:bg-brand-primary/40 transition-colors'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through'
                }`}
                title={isJoinable ? `Click to join: ${titleText}` : `${titleText} (Finished)`}
              >
                {teamName && <span className="font-bold opacity-70">[{teamName.slice(0, 3).toUpperCase()}] </span>}
                {scrum.title}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Mobile list view logic
  const sortedScrums = [...scrums]
    .filter(s => 
        new Date(s.scheduledAt).getFullYear() === currentDate.getFullYear() &&
        new Date(s.scheduledAt).getMonth() === currentDate.getMonth()
    )
    .sort((a,b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return (
    <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="px-3 py-1 rounded bg-light-border dark:bg-dark-border">&lt;</button>
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="px-3 py-1 rounded bg-light-border dark:bg-dark-border">&gt;</button>
      </div>
      
      {/* Desktop Grid View */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-semibold text-light-text-secondary dark:text-dark-text-secondary">{day}</div>
        ))}
        {calendarDays}
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-3">
        {sortedScrums.length > 0 ? sortedScrums.map(scrum => {
          const isJoinable = scrum.status !== 'FINISHED';
          const teamName = selectedTeamId === null ? teams.find(t => t.id === scrum.teamId)?.name : undefined;
          
          return (
            <div
              key={scrum.id}
              onClick={() => isJoinable && onStartScrum(scrum.id)}
              className={`p-3 rounded-lg flex items-center justify-between ${isJoinable ? 'bg-light-bg dark:bg-dark-bg cursor-pointer' : 'bg-gray-100 dark:bg-dark-border opacity-60'}`}
            >
              <div>
                {teamName && <p className="text-xs font-bold uppercase text-brand-secondary mb-1 tracking-wider">{teamName}</p>}
                <p className={`font-bold ${isJoinable ? '' : 'line-through'}`}>{scrum.title}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {new Date(scrum.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {isJoinable && (
                <span className="text-sm font-semibold text-brand-primary">Join</span>
              )}
            </div>
          )
        }) : <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-8">No scrums in this month.</p>}
      </div>
    </div>
  );
};
