import React from 'react';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, children, onMenuClick }) => {
  return (
    <header className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <button 
            onClick={onMenuClick} 
            className="md:hidden mr-4 text-light-text-secondary dark:text-dark-text-secondary p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border"
            aria-label="Open navigation menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h1>
      </div>
      <div>
        {children}
      </div>
    </header>
  );
};
