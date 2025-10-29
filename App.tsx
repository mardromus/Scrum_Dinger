import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { CreateScrumModal } from './components/CreateScrumModal';
import { MeetingRoom } from './components/MeetingRoom';
import { User, Scrum, Team, TeamMember, TeamMemberRole, Comment } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CalendarView } from './pages/CalendarView';
import { UpcomingScrums } from './pages/UpcomingScrums';
import { PreviousScrums } from './pages/PreviousScrums';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { Analytics } from './pages/Analytics';
import { JiraIntegrationModal } from './components/JiraIntegrationModal';
import { parseSummaryForActionItems } from './utility/summaryParser';
import { CreateTeamModal } from './components/CreateTeamModal';
import { TeamSettingsModal } from './components/TeamSettingsModal';


type Page = 'dashboard' | 'calendar' | 'upcoming' | 'previous' | 'analytics';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [scrums, setScrums] = useState<Scrum[]>([]);
  
  const [isCreateScrumModalOpen, setIsCreateScrumModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isTeamSettingsModalOpen, setIsTeamSettingsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeScrum, setActiveScrum] = useState<Scrum | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const { theme } = useTheme();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleLogin = () => {
    const loggedInUser: User = {
      uid: '12345',
      name: 'Alex Doe',
      email: 'alex.doe@example.com',
      avatarUrl: 'https://i.pravatar.cc/150?u=alex.doe@example.com',
      role: 'Scrum Master',
    };
    setUser(loggedInUser);

    const initialTeam: Team = {
      id: `team-${Date.now()}`,
      name: "Alex's Agile Team",
      members: [{ 
        uid: loggedInUser.uid, 
        name: loggedInUser.name, 
        email: loggedInUser.email, 
        role: 'Scrum Master' 
      }]
    };
    setTeams([initialTeam]);
    setSelectedTeamId(initialTeam.id);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveScrum(null);
    setCurrentPage('dashboard');
    setTeams([]);
    setSelectedTeamId(null);
    setScrums([]);
  };

  const handleScrumCreate = (newScrumData: Omit<Scrum, 'id' | 'status' | 'teamId'>, recurring: 'none' | 'daily' | 'weekly') => {
    if (!selectedTeamId) return;

    const createScrum = (date: Date): Scrum => ({
        ...newScrumData,
        id: `scrum-${Date.now()}-${Math.random()}`,
        status: 'NOT_STARTED',
        teamId: selectedTeamId,
        scheduledAt: date,
        isRecurring: recurring !== 'none',
        recurring: recurring === 'none' ? undefined : recurring,
    });
    
    let newScrums: Scrum[] = [];
    const baseDate = newScrumData.scheduledAt;

    if (recurring === 'none') {
        newScrums.push(createScrum(baseDate));
    } else if (recurring === 'daily') {
        // Schedule for the next 7 days including today
        for (let i = 0; i < 7; i++) {
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + i);
            newScrums.push(createScrum(newDate));
        }
    } else if (recurring === 'weekly') {
        // Schedule for the next 4 weeks including today
        for (let i = 0; i < 4; i++) {
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + i * 7);
            newScrums.push(createScrum(newDate));
        }
    }
    setScrums(prev => [...prev, ...newScrums]);
  };
  
  const handleStartScrum = (scrumId: string) => {
    const scrumToStart = scrums.find(s => s.id === scrumId);
    if (scrumToStart) {
      setActiveScrum({ ...scrumToStart, status: 'IN_PROGRESS' });
    }
  };
  
  const handleMeetingEnd = (updatedScrum: Scrum, talkTimes: Record<string, number>) => {
    const actionItems = updatedScrum.summary ? parseSummaryForActionItems(updatedScrum.summary) : [];
    setScrums(prevScrums => 
        prevScrums.map(s => s.id === updatedScrum.id ? { 
            ...updatedScrum, 
            status: 'FINISHED',
            speakerTalkTimes: talkTimes,
            actionItems: actionItems
        } : s)
    );
    setActiveScrum(null);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleToggleActionItem = (scrumId: string, itemIndex: number) => {
    setScrums(scrums.map(scrum => {
      if (scrum.id === scrumId && scrum.actionItems) {
        const newActionItems = [...scrum.actionItems];
        newActionItems[itemIndex].completed = !newActionItems[itemIndex].completed;
        return { ...scrum, actionItems: newActionItems };
      }
      return scrum;
    }));
  };

  const handleAddComment = (scrumId: string, text: string) => {
    if (!user || !text.trim()) return;
    const newComment: Comment = {
      author: user.name,
      text,
      createdAt: new Date(),
    };
    setScrums(scrums.map(scrum => {
      if (scrum.id === scrumId) {
        return { ...scrum, comments: [...(scrum.comments || []), newComment] };
      }
      return scrum;
    }));
  };

  // Team Handlers
  const handleCreateTeam = (name: string) => {
    if (!user) return;
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      members: [{ uid: user.uid, name: user.name, email: user.email, role: 'Scrum Master' }]
    };
    setTeams(prev => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
  };

  const handleInviteMember = (teamId: string, email: string) => {
    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        const newMember: TeamMember = {
          uid: `user-${Date.now()}`,
          name: email.split('@')[0],
          email,
          role: 'Member'
        };
        return { ...team, members: [...team.members, newMember] };
      }
      return team;
    }));
  };

  const handleUpdateMemberRole = (teamId: string, memberId: string, newRole: TeamMemberRole) => {
    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          members: team.members.map(m => m.uid === memberId ? { ...m, role: newRole } : m)
        };
      }
      return team;
    }));
  };
  
  const handleRemoveMember = (teamId: string, memberId: string) => {
    if(user?.uid === memberId) {
      alert("You cannot remove yourself from the team.");
      return;
    }
    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        return { ...team, members: team.members.filter(m => m.uid !== memberId) };
      }
      return team;
    }));
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  
  const renderPage = () => {
    const teamScrums = selectedTeamId
      ? scrums.filter(s => s.teamId === selectedTeamId)
      : scrums;
    
    const upcomingScrums = teamScrums.filter(s => s.status === 'NOT_STARTED' || s.status === 'IN_PROGRESS');
    const previousScrums = teamScrums.filter(s => s.status === 'FINISHED');
    
    const membersForAnalytics = selectedTeam 
      ? selectedTeam.members 
      // De-duplicate members if in "All Teams" view
      : Array.from(new Map(teams.flatMap(t => t.members).map(m => [m.uid, m])).values());

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard scrums={upcomingScrums} onStartScrum={handleStartScrum} teams={teams} selectedTeamId={selectedTeamId} />;
      case 'calendar':
        return <CalendarView scrums={teamScrums} onStartScrum={handleStartScrum} teams={teams} selectedTeamId={selectedTeamId} />;
      case 'upcoming':
        return <UpcomingScrums scrums={upcomingScrums} onStartScrum={handleStartScrum} teams={teams} selectedTeamId={selectedTeamId} />;
      case 'previous':
        return <PreviousScrums scrums={previousScrums} onToggleActionItem={handleToggleActionItem} onJiraClick={() => setIsJiraModalOpen(true)} teams={teams} selectedTeamId={selectedTeamId} onAddComment={handleAddComment} />;
      case 'analytics':
        return <Analytics scrums={previousScrums} members={membersForAnalytics} />;
      default:
        return <Dashboard scrums={upcomingScrums} onStartScrum={handleStartScrum} teams={teams} selectedTeamId={selectedTeamId} />;
    }
  };

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    calendar: 'Scrum Calendar',
    upcoming: 'Upcoming Scrums',
    previous: 'Previous Scrums',
    analytics: 'Analytics & Insights'
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  if (activeScrum) {
    return <MeetingRoom scrum={activeScrum} onMeetingEnd={handleMeetingEnd} />;
  }
  
  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary overflow-hidden">
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onProfileClick={() => setIsProfileModalOpen(true)}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
        onCreateTeam={() => setIsCreateTeamModalOpen(true)}
        onTeamSettingsClick={() => setIsTeamSettingsModalOpen(true)}
        isMobileOpen={isSidebarOpen}
        closeMobileSidebar={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={pageTitles[currentPage]}
          onMenuClick={() => setIsSidebarOpen(true)}
        >
          <button
            onClick={() => setIsCreateScrumModalOpen(true)}
            disabled={!selectedTeamId}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary rounded-md text-white font-semibold transition-colors shadow-md text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            + New Scrum
          </button>
        </Header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderPage()}
        </main>
      </div>
      <CreateScrumModal
        isOpen={isCreateScrumModalOpen}
        onClose={() => setIsCreateScrumModalOpen(false)}
        onScrumCreate={handleScrumCreate}
        teamMembers={selectedTeam?.members || []}
      />
      {user && (
        <ProfileSettingsModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onSave={handleProfileUpdate}
        />)}
      <JiraIntegrationModal isOpen={isJiraModalOpen} onClose={() => setIsJiraModalOpen(false)} />
      <CreateTeamModal 
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onCreateTeam={handleCreateTeam}
      />
      <TeamSettingsModal
        isOpen={isTeamSettingsModalOpen}
        onClose={() => setIsTeamSettingsModalOpen(false)}
        team={selectedTeam || null}
        onInviteMember={handleInviteMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
