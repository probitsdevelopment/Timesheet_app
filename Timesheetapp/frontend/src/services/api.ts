const API_BASE_URL = 'http://localhost:3001';

// Get token from localStorage
const getToken = () => localStorage.getItem('authToken');

export const apiClient = {
  get: async (endpoint: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    console.log('📤 POST Request to:', endpoint, 'Data:', data);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  delete: async (endpoint: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
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
  getAll: () => apiClient.get('/my-time-entries'),
  getById: (id: string) => apiClient.get(`/time-entries/${id}`),
  create: (entry: any) => apiClient.post('/time-entries', entry),
  update: (id: string, entry: any) => apiClient.put(`/time-entries/${id}`, entry),
  delete: (id: string) => apiClient.delete(`/time-entries/${id}`),
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

// Holiday Service
export const holidayService = {
  getAll: () => apiClient.get('/holidays'),
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