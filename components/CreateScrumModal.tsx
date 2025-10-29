import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Scrum, Attendee, TeamMember } from '../types';

interface CreateScrumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrumCreate: (scrum: Omit<Scrum, 'id' | 'status' | 'teamId'>, recurring: 'none' | 'daily' | 'weekly') => void;
  teamMembers: TeamMember[];
}

const AttendeeChip: React.FC<{ email: string; onRemove: () => void }> = ({ email, onRemove }) => (
    <div className="bg-brand-primary/20 text-brand-primary text-sm font-semibold px-3 py-1 rounded-full flex items-center">
        <span>{email}</span>
        <button onClick={onRemove} className="ml-2 text-brand-primary hover:text-white hover:bg-brand-primary rounded-full w-4 h-4 flex items-center justify-center">
            &times;
        </button>
    </div>
);

export const CreateScrumModal: React.FC<CreateScrumModalProps> = ({ isOpen, onClose, onScrumCreate, teamMembers }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attendeeInput, setAttendeeInput] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [timePerSpeakerSeconds, setTimePerSpeakerSeconds] = useState(90);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly'>('none');
  
  useEffect(() => {
    if (isOpen) {
        setAttendees(teamMembers.map(m => ({ email: m.email, name: m.name })));
    }
  }, [isOpen, teamMembers]);


  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAttendeeInput('');
    setAttendees([]);
    setDurationMinutes(15);
    setTimePerSpeakerSeconds(90);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00');
    setRecurring('none');
  }

  const handleAddAttendee = () => {
    const email = attendeeInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && !attendees.some(a => a.email === email)) {
      setAttendees([...attendees, { email, name: email.split('@')[0] }]);
      setAttendeeInput('');
    }
  };
  
  const handleAttendeeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddAttendee();
    }
  };

  const handleRemoveAttendee = (emailToRemove: string) => {
    setAttendees(attendees.filter(a => a.email !== emailToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendees.length === 0) {
        alert("Please add at least one attendee.");
        return;
    }

    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledAt = new Date(year, month - 1, day, hours, minutes);
    
    onScrumCreate({
      title,
      description,
      attendees,
      durationMinutes,
      timePerSpeakerSeconds,
      scheduledAt,
    }, recurring);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">Schedule New Scrum</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <fieldset>
            <legend className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">Meeting Details</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="scrum-title" className="sr-only">Meeting Title</label>
                <input
                  id="scrum-title"
                  type="text"
                  placeholder="Meeting Title (e.g., 'Frontend Team Sync')"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="scrum-description" className="sr-only">Description / Agenda</label>
                <textarea
                  id="scrum-description"
                  placeholder="Description / Agenda (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          </fieldset>
          
          <fieldset>
             <legend className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">Scheduling & Timing</legend>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="scrum-date" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Date</label>
                  <input id="scrum-date" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                </div>
                <div>
                  <label htmlFor="scrum-time" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Time</label>
                  <input id="scrum-time" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                </div>
                <div>
                  <label htmlFor="scrum-duration" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Total Duration (min)</label>
                  <input id="scrum-duration" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" min="1" required />
                </div>
                <div>
                  <label htmlFor="scrum-speaker-time" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Time per Speaker (sec)</label>
                  <input id="scrum-speaker-time" type="number" value={timePerSpeakerSeconds} onChange={(e) => setTimePerSpeakerSeconds(Number(e.target.value))} className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" min="10" required />
                </div>
            </div>
             <div className="mt-4">
                <label htmlFor="scrum-recurring" className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mr-2">Repeat:</label>
                <select id="scrum-recurring" value={recurring} onChange={e => setRecurring(e.target.value as any)} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
            </div>
          </fieldset>
          
          <fieldset>
            <legend className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">Attendees</legend>
            <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2">
                <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem] items-center">
                    {attendees.map(attendee => (
                        <AttendeeChip key={attendee.email} email={attendee.email} onRemove={() => handleRemoveAttendee(attendee.email)} />
                    ))}
                    <input
                        type="email"
                        placeholder={attendees.length === 0 ? "Enter attendee email and press Enter..." : "Add guest..."}
                        value={attendeeInput}
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        onKeyDown={handleAttendeeKeyDown}
                        className="flex-grow bg-transparent focus:outline-none p-2"
                    />
                </div>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 pt-4 mt-6 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="mt-2 sm:mt-0 w-full sm:w-auto px-6 py-3 bg-light-border dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-light-text-primary dark:text-dark-text-primary font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-brand-primary hover:bg-brand-secondary rounded-md text-white font-semibold transition-colors shadow-lg"
            >
              Create Scrum
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};