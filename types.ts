export interface User {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string;
  role?: string;
}

export type TeamMemberRole = 'Scrum Master' | 'Member' | 'Observer';

export interface TeamMember {
  uid: string;
  name: string;
  email: string;
  role: TeamMemberRole;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}


export interface Attendee {
  email: string;
  name: string;
}

export interface ActionItem {
  text: string;
  completed: boolean;
}

export interface Comment {
  author: string;
  text: string;
  createdAt: Date;
}

export interface Scrum {
  id: string;
  title: string;
  attendees: Attendee[];
  durationMinutes: number;
  timePerSpeakerSeconds: number;
  scheduledAt: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED';
  teamId: string;
  isRecurring?: boolean;
  recurring?: 'daily' | 'weekly';
  transcript?: string;
  summary?: string;
  description?: string;
  speakerTalkTimes?: Record<string, number>;
  actionItems?: ActionItem[];
  notes?: string;
  comments?: Comment[];
}

export enum MeetingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
}