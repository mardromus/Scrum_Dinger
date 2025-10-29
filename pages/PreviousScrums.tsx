import React, { useState } from 'react';
import { Scrum, Team } from '../types';

interface AccordionItemProps {
  scrum: Scrum;
  onToggleActionItem: (scrumId: string, itemIndex: number) => void;
  onJiraClick: () => void;
  onAddComment: (scrumId: string, text: string) => void;
  teamName?: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ scrum, onToggleActionItem, onJiraClick, onAddComment, teamName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(scrum.id, commentText.trim());
      setCommentText('');
    }
  };

  return (
    <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md">
      <h2>
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-col text-left">
            {teamName && <span className="text-xs font-bold uppercase text-brand-secondary mb-1 tracking-wider">{teamName}</span>}
            <span className="font-bold">{scrum.title} - {new Date(scrum.scheduledAt).toLocaleDateString()}</span>
          </div>
          <svg className={`w-6 h-6 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        </button>
      </h2>
      {isOpen && (
        <div className="p-5 border-t border-light-border dark:border-dark-border">
            {scrum.actionItems && scrum.actionItems.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-semibold mb-3">Action Items</h4>
                    <ul className="space-y-3">
                        {scrum.actionItems.map((item, index) => (
                            <li key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-light-bg dark:bg-dark-bg p-3 rounded-md">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={item.completed} 
                                        onChange={() => onToggleActionItem(scrum.id, index)}
                                        className="w-5 h-5 rounded text-brand-primary focus:ring-brand-secondary"
                                    />
                                    <span className={`ml-3 text-sm ${item.completed ? 'line-through text-light-text-secondary dark:text-dark-text-secondary' : ''}`}>
                                        {item.text}
                                    </span>
                                </label>
                                <button onClick={onJiraClick} title="Create Jira Ticket (Coming Soon)" className="text-xs bg-blue-100 text-blue-800 font-bold py-1 px-2 rounded hover:bg-blue-200 self-end sm:self-center">
                                  Jira
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h4 className="font-semibold">Full Summary</h4>
              {scrum.summary ? (
                   <pre className="whitespace-pre-wrap font-sans bg-light-bg dark:bg-dark-bg p-3 rounded-md">{scrum.summary}</pre>
              ) : <p className="text-light-text-secondary dark:text-dark-text-secondary">No summary was generated for this meeting.</p>}
             
              <h4 className="font-semibold mt-4">Full Transcript</h4>
               {scrum.transcript ? (
                   <pre className="whitespace-pre-wrap font-sans bg-light-bg dark:bg-dark-bg p-3 rounded-md max-h-64 overflow-y-auto">{scrum.transcript}</pre>
              ) : <p className="text-light-text-secondary dark:text-dark-text-secondary">No transcript available.</p>}
            </div>

            {/* Comments Section */}
            <div className="mt-6">
                <h4 className="font-semibold mb-3">Comments</h4>
                <div className="space-y-4">
                    {scrum.comments && scrum.comments.map((comment, index) => (
                        <div key={index} className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                            <p className="font-bold text-sm text-brand-secondary">{comment.author}</p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">{new Date(comment.createdAt).toLocaleString()}</p>
                            <p className="text-sm">{comment.text}</p>
                        </div>
                    ))}
                    {(!scrum.comments || scrum.comments.length === 0) && (
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">No comments yet.</p>
                    )}
                </div>
                <div className="mt-4">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add an update or resolution..."
                        rows={3}
                        className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button
                        onClick={handleAddComment}
                        className="mt-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors text-sm"
                    >
                        Post Comment
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

interface PreviousScrumsProps {
  scrums: Scrum[];
  onToggleActionItem: (scrumId: string, itemIndex: number) => void;
  onJiraClick: () => void;
  onAddComment: (scrumId: string, text: string) => void;
  teams: Team[];
  selectedTeamId: string | null;
}

export const PreviousScrums: React.FC<PreviousScrumsProps> = ({ scrums, onToggleActionItem, onJiraClick, onAddComment, teams, selectedTeamId }) => {
  return (
    <div className="space-y-4">
      {scrums.length > 0 ? (
        scrums
          .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
          .map(scrum => {
            const teamName = selectedTeamId === null 
              ? teams.find(t => t.id === scrum.teamId)?.name 
              : undefined;
            return <AccordionItem key={scrum.id} scrum={scrum} onToggleActionItem={onToggleActionItem} onJiraClick={onJiraClick} onAddComment={onAddComment} teamName={teamName} />
          })
      ) : (
        <div className="text-center py-16 bg-light-surface dark:bg-dark-surface rounded-lg">
          <h3 className="text-xl">No previously completed scrums.</h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">Your meeting history will appear here.</p>
        </div>
      )}
    </div>
  );
};
