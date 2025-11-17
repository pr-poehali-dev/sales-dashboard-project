const API_BASE = 'https://functions.poehali.dev';

const ENDPOINTS = {
  auth: '4a991de6-4095-41da-afab-09178b686413',
  orders: 'aaf72245-f910-436e-aa21-6a01d96511cb',
  stages: 'e1085901-d7be-4dc2-94d9-7e5d205e627a',
  files: 'cc51e324-c57a-4437-a2c4-8a0e6fc87c14',
  dashboard: 'dadab167-f1e7-4e0b-9b38-7005558f26ee'
};

const getUrl = (endpoint: keyof typeof ENDPOINTS) => `${API_BASE}/${ENDPOINTS[endpoint]}`;

export const getAuthToken = () => localStorage.getItem('auth_token');

export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);

export const clearAuthToken = () => localStorage.removeItem('auth_token');

const apiCall = async (endpoint: keyof typeof ENDPOINTS, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['X-Auth-Token'] = token;
  }

  const response = await fetch(getUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; role?: string }) =>
      apiCall('auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', ...data }),
      }),
    login: (data: { email: string; password: string }) =>
      apiCall('auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', ...data }),
      }),
    me: () => apiCall('auth', { method: 'GET' }),
  },
  orders: {
    list: (params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetch(`${getUrl('orders')}${query ? `?${query}` : ''}`, {
        headers: { 'X-Auth-Token': getAuthToken() || '' },
      }).then(r => r.json());
    },
    get: (id: number) => {
      return fetch(`${getUrl('orders')}?id=${id}`, {
        headers: { 'X-Auth-Token': getAuthToken() || '' },
      }).then(r => r.json());
    },
    create: (data: any) => apiCall('orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      fetch(`${getUrl('orders')}?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': getAuthToken() || '',
        },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    delete: (id: number) =>
      fetch(`${getUrl('orders')}?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': getAuthToken() || '' },
      }).then(r => r.json()),
  },
  dashboard: {
    stats: () => apiCall('dashboard', { method: 'GET' }),
  },
};
