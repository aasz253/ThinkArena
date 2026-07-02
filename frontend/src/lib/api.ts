import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", res.data.access_token);
          localStorage.setItem("refresh_token", res.data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/auth/change-password", data),
  forgotPassword: (data: { email: string }) => api.post("/auth/forgot-password", data),
  resetPassword: (data: { token: string; password: string }) => api.post("/auth/reset-password", data),
};

export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: any) => api.put("/users/profile", data),
  getAchievements: () => api.get("/users/achievements"),
  getBadges: () => api.get("/users/badges"),
  getLeaderboard: (limit?: number) => api.get("/users/leaderboard", { params: { limit } }),
  getUser: (id: string) => api.get(`/users/${id}`),
};

export const quizzesAPI = {
  create: (data: any) => api.post("/quizzes", data),
  list: (params?: any) => api.get("/quizzes", { params }),
  get: (id: string) => api.get(`/quizzes/${id}`),
  update: (id: string, data: any) => api.put(`/quizzes/${id}`, data),
  delete: (id: string) => api.delete(`/quizzes/${id}`),
  duplicate: (id: string) => api.post(`/quizzes/${id}/duplicate`),
  getCategories: () => api.get("/quizzes/categories"),
  getTags: () => api.get("/quizzes/tags"),
};

export const gamesAPI = {
  create: (data: { quiz_id: string }) => api.post("/games", data),
  join: (data: { game_pin: string; nickname: string }) => api.post("/games/join", data),
  get: (id: string) => api.get(`/games/${id}`),
  getResults: (id: string) => api.get(`/games/${id}/results`),
  getHistory: () => api.get("/games/history/mine"),
  exportCSV: (id: string) => api.get(`/games/${id}/results/csv`, { responseType: "blob" }),
};

export const aiAPI = {
  generateQuiz: (data: { topic: string; difficulty?: string; num_questions?: number; question_types?: string[] }) =>
    api.post("/ai/generate-quiz", data),
  generateQuestions: (data: { topic: string; count?: number; question_type?: string }) =>
    api.post("/ai/generate-questions", data),
  explain: (data: { question: string; correct_answer: string }) => api.post("/ai/explain", data),
  summarize: (data: { quiz_title: string; questions: any[] }) => api.post("/ai/summarize", data),
  recommendDifficulty: (data: { topic: string }) => api.post("/ai/recommend-difficulty", data),
  tutor: (data: { question: string; user_answer: string; correct_answer: string }) => api.post("/ai/tutor", data),
  studyAssistant: (data: { topic: string; user_level?: string }) => api.post("/ai/study-assistant", data),
};

export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  listUsers: (params?: any) => api.get("/admin/users", { params }),
  getUser: (userId: string) => api.get(`/admin/users/${userId}`),
  updateUserRole: (userId: string, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
  toggleUserActive: (userId: string) => api.put(`/admin/users/${userId}/toggle-active`),
  listQuizzes: (params?: any) => api.get("/admin/quizzes", { params }),
  deleteQuiz: (id: string) => api.delete(`/admin/quizzes/${id}`),
  getLogs: (params?: any) => api.get("/admin/logs", { params }),
};
