import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

/* ================= TYPES ================= */

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  refreshToken: () => Promise<void>;
}

interface RefreshResponse {
  data: {
    accessToken: string;
    user: User;
  };
}

/* ================= TOKEN QUEUE ================= */

let isRefreshing = false;

let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });

  failedQueue = [];
};

/* ================= STORE ================= */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken });
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      clearAuth: () => {
        set({ user: null, accessToken: null });
        delete axios.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        if (isRefreshing) {
            return new Promise<void>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            });
        }

        isRefreshing = true;

        try {
          const response = await axios.post<RefreshResponse>(
            '/api/auth/refresh'
          );

          const { accessToken: newAccessToken, user } = response.data.data;

          get().setAuth(user, newAccessToken);
          processQueue(null);
        } catch (error) {
          get().clearAuth();
          processQueue(error);
          throw error;
        } finally {
          isRefreshing = false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);

/* ================= AXIOS INTERCEPTOR ================= */

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshToken();
        const { accessToken } = useAuthStore.getState();

        if (accessToken) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/* ================= INIT ================= */

if (typeof window !== 'undefined') {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    useAuthStore.getState().refreshToken().catch(() => {});
  }
}