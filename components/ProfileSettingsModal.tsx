import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => void;
}

const PREDEFINED_AVATARS = [
  'https://i.pravatar.cc/150?u=person1',
  'https://i.pravatar.cc/150?u=person2',
  'https://i.pravatar.cc/150?u=person3',
  'https://i.pravatar.cc/150?u=person4',
  'https://i.pravatar.cc/150?u=person5',
  'https://i.pravatar.cc/150?u=person6',
  'https://i.pravatar.cc/150?u=person7',
  'https://i.pravatar.cc/150?u=person8',
];


export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role || '');
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, name, role, avatarUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-2xl w-full max-w-lg m-4">
        <h2 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">Profile Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-24 h-24 rounded-full object-cover ring-4 ring-brand-primary/50" 
              onError={(e) => { e.currentTarget.src = `https://i.pravatar.cc/150?u=${user.email}` }} 
            />
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{user.email}</p>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Role</label>
            <input
              id="role"
              type="text"
              placeholder="e.g. Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Choose an Avatar</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {PREDEFINED_AVATARS.map(url => (
                <img
                  key={url}
                  src={url}
                  alt="Predefined avatar"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-12 h-12 rounded-full cursor-pointer transition-transform transform hover:scale-110 ${avatarUrl === url ? 'ring-4 ring-brand-primary' : 'ring-2 ring-transparent'}`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Or use a custom URL</label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="block w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};