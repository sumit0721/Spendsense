import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for token rotation on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out user (handled at application layer or by redirect)
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

export const updatePassword = async (passwordData) => {
  const response = await api.put('/auth/updatepassword', passwordData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgotpassword', { email });
  return response.data;
};

export const resetPassword = async (email, otp, password) => {
  const response = await api.put(`/auth/resetpassword`, { email, otp, password });
  return response.data;
};

export const getTransactions = async (page = 1, limit = 10, filters = {}) => {
  let p = page;
  let l = limit;
  let f = filters;

  if (typeof page === 'object' && page !== null) {
    p = page.page || 1;
    l = page.limit || 10;
    f = { ...page };
    delete f.page;
    delete f.limit;
  }

  const params = new URLSearchParams({ page: p, limit: l, ...f });
  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
};

export const createTransaction = async (transactionData) => {
  const response = await api.post('/transactions', transactionData);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const getBudgetForecast = async () => {
  const response = await api.get('/budgets/forecast');
  return response.data;
};

export const getBudget = async (month, year) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  const response = await api.get(`/budgets?${params.toString()}`);
  return response.data;
};

export const setBudget = async (budgetData) => {
  const response = await api.post('/budgets', budgetData);
  return response.data;
};

export const askAdvisor = async (prompt) => {
  const response = await api.post('/advisor/ask', { prompt });
  return response.data;
};

export const getTransactionStats = async (days = 90) => {
  const response = await api.get(`/transactions/stats?days=${days}`);
  return response.data;
};

export const getDashboardSummary = async () => {
  const res = await api.get('/transactions/summary');
  return res.data;
};

export const getMonthlyTrend = async (months = 6) => {
  const res = await api.get(`/transactions/trend?months=${months}`);
  return res.data;
};

export const getGoals = async () => (await api.get('/goals')).data;
export const createGoal = async (data) => (await api.post('/goals', data)).data;
export const updateGoalProgress = async (id, data) => (await api.patch(`/goals/${id}/progress`, data)).data;
export const updateGoal = async (id, data) => (await api.put(`/goals/${id}`, data)).data;
export const deleteGoal = async (id) => (await api.delete(`/goals/${id}`)).data;
export const deleteGoalContribution = async (goalId, contributionId) => (await api.delete(`/goals/${goalId}/contributions/${contributionId}`)).data;
export const editGoalContribution = async (goalId, contributionId, data) => (await api.put(`/goals/${goalId}/contributions/${contributionId}`, data)).data;

export const getRecurring = async () => (await api.get('/recurring')).data;
export const createRecurring = async (data) => (await api.post('/recurring', data)).data;
export const updateRecurring = async (id, data) => (await api.put(`/recurring/${id}`, data)).data;
export const deleteRecurring = async (id) => (await api.delete(`/recurring/${id}`)).data;

export const exportPDF = async () => {
  const res = await api.get('/transactions/export/pdf', { responseType: 'blob' });
  return res.data;
};
export const exportExcel = async () => {
  const res = await api.get('/transactions/export/excel', { responseType: 'blob' });
  return res.data;
};

export default api;
