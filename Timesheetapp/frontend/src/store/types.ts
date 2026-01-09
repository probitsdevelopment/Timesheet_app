// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  managerid?: string | number;
  manager_name?: string;
  organization?: string;
  numberofhours?: number;
  createdAt: string;
}

export interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registeredUsers: User[];
}

// Project Types
export interface Project {
  id: string;
  name: string;
  code: string;
  startDate: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'completed' | 'on-hold';
}

export interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

// User Types
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  managerid?: string | number;
  organization?: string;
  numberofhours?: number;
  createdAt: string;
}

export interface UserState {
  users: AppUser[];
  isLoading: boolean;
  error: string | null;
}

// Sidebar Types
export interface SidebarState {
  isCollapsed: boolean;
  activeSection: string;
  expandedMenus: string[];
}

// Timesheet Types
export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  date: string;
  task_start?: string;
  task_end?: string;
  hours: number;
  description: string;
  reason: string;
  status: string;
  organization?: string;
  created_at: string;
}

export interface Timesheet {
  id: string | number;
  user_id: string | number;
  month: string; // YYYY-MM format
  year: number;
  total_hours: number;
  entries?: TimeEntry[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  submitted_to?: string | number; // Manager ID
  approved_by?: string | number; // Manager ID
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  organization?: string;
}

// Temporary form entry for adding multiple entries before submission
export interface TempFormEntry {
  taskStart: string;
  taskEnd: string;
  hours: number;
  project_id: string;
  projectName: string;
  description: string;
}

export interface TimesheetState {
  entries: TimeEntry[];
  timesheets: Timesheet[];
  tempFormEntries: TempFormEntry[]; // Persist entries across modal open/close
  showAddEntryModal: boolean;
  isLoading: boolean;
  error: string | null;
  selectedMonth?: string; // Current selected month
  selectedDate: string | null; // Selected date for modal
}

// Root State Type
export interface RootState {
  auth: AuthState;
  projects: ProjectState;
  users: UserState;
  sidebar: SidebarState;
  timesheet: TimesheetState;
}
