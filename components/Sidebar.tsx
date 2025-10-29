import React from 'react';
import { User, Team } from '../types';
import { useTheme } from '../context/ThemeContext';
import { HomeIcon } from './icons/HomeIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ListIcon } from './icons/ListIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { CogIcon } from './icons/CogIcon';
import { LogoIcon } from './icons/LogoIcon';

type Page = 'dashboard' | 'calendar' | 'upcoming' | 'previous' | 'analytics';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onProfileClick: () => void;
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string | null) => void;
  onCreateTeam: () => void;
  onTeamSettingsClick: () => void;
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
        isActive
          ? 'bg-brand-primary/20 text-brand-primary'
          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border'
      }`}
    >
      {icon}
      <span className="ml-3 font-semibold">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
    user, 
    onLogout, 
    currentPage, 
    setCurrentPage, 
    onProfileClick, 
    teams, 
    selectedTeamId, 
    onSelectTeam, 
    onCreateTeam, 
    onTeamSettingsClick,
    isMobileOpen,
    closeMobileSidebar
}) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', icon: <HomeIcon className="w-6 h-6" />, label: 'Dashboard' },
    { id: 'calendar', icon: <CalendarIcon className="w-6 h-6" />, label: 'Calendar' },
    { id: 'upcoming', icon: <ListIcon className="w-6 h-6" />, label: 'Upcoming Scrums' },
    { id: 'previous', icon: <ArchiveIcon className="w-6 h-6" />, label: 'Previous Scrums' },
    { id: 'analytics', icon: <ChartBarIcon className="w-6 h-6" />, label: 'Analytics' },
  ] as const;

  const handleNavigation = (action: () => void) => {
    action();
    closeMobileSidebar();
  }

  const handleSelectTeam = (teamId: string | null) => {
    onSelectTeam(teamId);
    closeMobileSidebar();
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={closeMobileSidebar}
          aria-hidden="true"
        ></div>
      )}
      <aside className={`w-64 flex-shrink-0 bg-light-surface dark:bg-dark-surface p-4 flex flex-col shadow-lg fixed md:static md:translate-x-0 inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center p-3 mb-6">
          <div className="flex items-center space-x-2">
            <LogoIcon className="w-10 h-10" />
            <h1 className="text-2xl font-bold">ScrumDinger</h1>
          </div>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            A Product By Mardromus
          </p>
        </div>

        <div className="px-3 mb-4">
          <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary">Teams</h2>
              <button
                  onClick={() => handleNavigation(onTeamSettingsClick)}
                  disabled={!selectedTeamId}
                  className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Team Settings"
              >
                  <CogIcon className="w-5 h-5" />
              </button>
          </div>
          <ul className="space-y-1">
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); handleSelectTeam(null); }}
                className={`block p-2 rounded-md font-semibold text-sm truncate ${selectedTeamId === null ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-gray-200 dark:hover:bg-dark-border'}`}
              >
                All Teams
              </a>
            </li>
            {teams.map(team => (
              <li key={team.id}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleSelectTeam(team.id); }}
                  className={`block p-2 rounded-md font-semibold text-sm truncate ${selectedTeamId === team.id ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-gray-200 dark:hover:bg-dark-border'}`}
                >
                  {team.name}
                </a>
              </li>
            ))}
          </ul>
          <button onClick={() => handleNavigation(onCreateTeam)} className="w-full mt-2 text-left p-2 rounded-md text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border font-semibold">
            + Create Team
          </button>
        </div>

        <div className="border-t border-light-border dark:border-dark-border my-4"></div>

        <nav className="flex-grow">
          <ul>
            {navItems.map(item => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.id}
                onClick={() => handleNavigation(() => setCurrentPage(item.id))}
              />
            ))}
          </ul>
        </nav>

        <div className="mt-auto">
          <div className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Switch Theme</span>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border">
                  {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
              </button>
          </div>
          <div className="border-t border-light-border dark:border-dark-border pt-4 mt-2">
              <div 
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border cursor-pointer"
                onClick={() => handleNavigation(onProfileClick)}
              >
                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{user.email}</p>
                </div>
              </div>
            <button
              onClick={onLogout}
              className="w-full mt-2 text-left p-3 rounded-lg text-sm text-red-500 hover:bg-red-500/10 font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};