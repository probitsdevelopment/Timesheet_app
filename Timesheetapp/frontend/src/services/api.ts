// ✅ For single service deployment: use relative paths
// For multi-service: use VITE_API_BASE_URL environment variable
import { baseURL } from './networkConstant';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/';
const normalizeEndpoint = (endpoint: string) => {
  if (endpoint.startsWith('/')) return endpoint;
  return '/' + endpoint;
};
// Get token from localStorage
const getToken = () => localStorage.getItem('authToken');

export const apiClient = {
  get: async (endpoint: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${normalizeEndpoint(endpoint)}`, { headers });
    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:', { status: response.status, data: responseData });
      throw new Error(responseData.error || `API Error: ${response.status}`);
    }

    return responseData;
  },

  post: async (endpoint: string, data: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('📤 POST Request to:', endpoint, 'Data:', data);

    const response = await fetch(`${API_BASE_URL}${normalizeEndpoint(endpoint)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:', { status: response.status, data: responseData });
      throw new Error(responseData.error || `API Error: ${response.status}`);
    }

    return responseData;
  },

  put: async (endpoint: string, data: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${normalizeEndpoint(endpoint)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:', { status: response.status, data: responseData });
      throw new Error(responseData.error || `API Error: ${response.status}`);
    }

    return responseData;
  },

  delete: async (endpoint: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${normalizeEndpoint(endpoint)}`, {
      method: 'DELETE',
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:', { status: response.status, data: responseData });
      throw new Error(responseData.error || `API Error: ${response.status}`);
    }

    return responseData;
  },
};

// Auth Service - Uses /login and /register endpoints with bcrypt & JWT
export const authService = {
  register: (name: string, email: string, password: string, organization?: string) =>
    apiClient.post('/register', { name, email, password, organization }),

  login: (email: string, password: string) =>
    apiClient.post('/login', { email, password }),

  getCurrentUser: () =>
    apiClient.get('/me'),
};

// Project Service
export const projectService = {
  getAll: () => apiClient.get('/projects'),
  getById: (id: string) => apiClient.get(`/projects/${id}`),
  create: (project: any) => apiClient.post('/projects', project),
  update: (id: string, project: any) => apiClient.put(`/projects/${id}`, project),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};

// Time Entry Service
export const timesheetService = {
  getAll: (workLocation?: string) => {
    // ✅ NEW: Support filtering by work location
    const query = workLocation ? `?workLocation=${workLocation}` : '';
    return apiClient.get(`/my-time-entries${query}`);
  },
  getById: (id: string) => apiClient.get(`/time-entries/${id}`),
  create: (entry: any) => apiClient.post('/time-entries', entry),
  update: (id: string, entry: any) => apiClient.put(`/time-entries/${id}`, entry),
  delete: (id: string) => apiClient.delete(`/time-entries/${id}`),
  // ✅ NEW: Get entries filtered by work location
  getByLocation: (workLocation: 'office' | 'work_from_home') =>
    apiClient.get(`/my-time-entries?workLocation=${workLocation}`),
  // ✅ NEW: Get entries for a specific user (for manager approvals)
  getForUser: (userId: string) =>
    apiClient.get(`/time-entries/user/${userId}`),
};

// Timesheet Service (Monthly grouping)
export const timesheetSubmissionService = {
  getAll: () => apiClient.get('/timesheets'),
  getById: (id: string) => apiClient.get(`/timesheets/${id}`),
  getByUserId: (userId: string) => apiClient.get(`/timesheets?userId=${userId}`),
  getByMonth: (userId: string, month: string) =>
    apiClient.get(`/timesheets?userId=${userId}&month=${month}`),
  create: (timesheet: any) => apiClient.post('/timesheets', timesheet),
  update: (id: string, timesheet: any) => apiClient.put(`/timesheets/${id}`, timesheet),
  submit: (id: string, timesheetData: any) =>
    apiClient.put(`/timesheets/${id}`, { ...timesheetData, status: 'submitted', submittedAt: new Date().toISOString() }),
  approve: (id: string, approverId: string) =>
    apiClient.put(`/timesheets/${id}`, { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: approverId }),
  reject: (id: string, rejectionReason: string) =>
    apiClient.put(`/timesheets/${id}`, { status: 'rejected', rejectionReason }),
  getPendingApprovals: (managerId: string) =>
    apiClient.get(`/timesheets?submittedTo=${managerId}&status=submitted`),
};

// Approval Service
export const approvalService = {
  getAll: () => apiClient.get('/approvals'),
  update: (id: string, approval: any) => apiClient.put(`/approvals/${id}`, approval),
};

// Leave Service
export const leaveService = {
  getAll: () => apiClient.get('/leaves'),
  getById: (id: string) => apiClient.get(`/leaves/${id}`),
  getByUserId: (userId: string) => apiClient.get(`/leaves/user/${userId}`),
  getPending: () => apiClient.get('/leaves/pending/all'),
  create: (leave: any) => apiClient.post('/leaves', leave),
  update: (id: string, leave: any) => apiClient.put(`/leaves/${id}`, leave),
  delete: (id: string) => apiClient.delete(`/leaves/${id}`),
  approve: (id: string) => apiClient.post(`/leaves/${id}/approve`, {}),
  reject: (id: string, rejectionReason: string) => apiClient.post(`/leaves/${id}/reject`, { rejection_reason: rejectionReason }),
};

// User Service
export const userService = {
  getAll: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (user: any) => apiClient.post('/users', user),
  update: (id: string, user: any) => apiClient.put(`/users/${id}`, user),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  assignManager: (id: string, managerId: string) => apiClient.put(`/users/${id}/assign-manager`, { manager_id: managerId }),
};

export const salaryService = {
  getAll: () => apiClient.get('/salaries'),
  getByUserId: (userId: string) => apiClient.get(`/salaries?userId=${userId}`),
  create: (salary: any) => apiClient.post('/salaries', salary),
  update: (id: string, salary: any) => apiClient.put(`/salaries/${id}`, salary),
};

// Holiday Service
export const holidayService = {
  getAll: () => apiClient.get('/holidays'),
  getById: (id: string) => apiClient.get(`/holidays/${id}`),
  create: (holiday: any) => apiClient.post('/holidays', holiday),
  update: (id: string, holiday: any) => apiClient.put(`/holidays/${id}`, holiday),
  delete: (id: string) => apiClient.delete(`/holidays/${id}`),
};

// Leave Allocation Service
export const leaveAllocationService = {
  getBalance: () => apiClient.get('/leave-allocation/balance'),
  getBalanceForUser: (userId: string) => apiClient.get(`/leave-allocation/balance/${userId}`),
  getAll: () => apiClient.get('/leave-allocation'),
  update: (data: any) => apiClient.put('/leave-allocation', data),
};

// Salary Processing Service
export const salaryProcessingService = {
  process: (data: { userId: number; month: string }) =>
    apiClient.post('/salary-processing/process', data),
  getByUserAndMonth: (userId: number, month: string) =>
    apiClient.get(`/salary-processing/user/${userId}/${month}`),
  getByMonth: (month: string) =>
    apiClient.get(`/salary-processing/month?month=${month}`),
  getHistory: (userId: number) =>
    apiClient.get(`/salary-processing/history/${userId}`),
};