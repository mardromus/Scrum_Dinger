import React, { useState } from 'react';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (name: string) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onCreateTeam }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateTeam(name.trim());
      setName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-2xl w-full max-w-md m-4">
        <h2 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">Create New Team</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Team Name (e.g., 'Frontend Warriors')"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            required
          />
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-light-border dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-light-text-primary dark:text-dark-text-primary font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-brand-primary hover:bg-brand-secondary rounded-md text-white font-semibold transition-colors shadow-lg"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};