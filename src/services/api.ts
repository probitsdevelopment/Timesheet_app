const API_BASE_URL = 'http://localhost:3001';

export const apiClient = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
};

// Auth Service
export const authService = {
  login: (username: string, password: string) =>
    apiClient.get(`/users?username=${username}&password=${password}`),
  
  register: (user: any) =>
    apiClient.post('/users', user),
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
  getAll: () => apiClient.get('/timeEntries'),
  getById: (id: string) => apiClient.get(`/timeEntries/${id}`),
  create: (entry: any) => apiClient.post('/timeEntries', entry),
  update: (id: string, entry: any) => apiClient.put(`/timeEntries/${id}`, entry),
  delete: (id: string) => apiClient.delete(`/timeEntries/${id}`),
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

// User Service
export const userService = {
  getAll: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (user: any) => apiClient.post('/users', user),
  update: (id: string, user: any) => apiClient.put(`/users/${id}`, user),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
