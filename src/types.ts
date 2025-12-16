export enum UserRole {
  MANAGER = 'MANAGER',
  COLLABORATOR = 'COLLABORATOR'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Annotation {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description: string;
  timestamp: number; // when this was created
}

export interface VideoTask {
  id: string;
  projectId: string;
  title: string;
  videoUrl: string;
  assigneeId: string | null;
  status: TaskStatus;
  timeSpentSeconds: number; // Total automated time tracked
  annotations: Annotation[];
  lastUpdated: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
}
