import React from 'react';

interface JiraIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JiraIntegrationModal: React.FC<JiraIntegrationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-2xl w-full max-w-lg m-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Jira & Trello Integration is Coming Soon!</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
          Imagine turning your action items into Jira tickets or Trello cards with a single click. 
          This powerful integration will bridge the gap between your daily scrums and your project management workflow, ensuring nothing gets lost in translation.
        </p>
        <p className="font-semibold text-brand-secondary mb-8">Stay tuned for updates!</p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-brand-primary hover:bg-brand-secondary rounded-md text-white font-semibold transition-colors shadow-lg"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};