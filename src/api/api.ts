import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const BASE_URL = supabaseUrl;
export const ANON_KEY = supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const getSession = () => supabase.auth.getSession();
export const getCurrentUser = () => supabase.auth.getUser();

export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T> | PaginatedResponse<T>> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers();

    headers.set("Content-Type", "application/json");
    headers.set("apikey", ANON_KEY);

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    if (options.headers) {
      const customHeaders = new Headers(options.headers);
      customHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.statusText}`;

      try {
        const text = await response.text();
        if (text) {
          const errorData = JSON.parse(text);

          if (errorData?.error) {
            errorMessage = `API request failed: ${errorData.error}`;
          } else if (errorData?.message) {
            errorMessage = `API request failed: ${errorData.message}`;
          }

          console.error("API Error Details:", errorData);
        }
      } catch {
      }

      throw new ApiError(errorMessage, response.status);
    }

    if (response.status === 204) {
      return { data: null as T };
    }

    const text = await response.text();

    if (!text) {
      return { data: null as T };
    }

    const data = JSON.parse(text);

    if (data?.pagination) {
      return {
        data: data.data,
        pagination: data.pagination,
      } as PaginatedResponse<T>;
    }

    return { data: data.data ?? data } as ApiResponse<T>;
  } catch (error) {
    console.error("API Request Error:", error);

    throw error instanceof ApiError
      ? error
      : new ApiError("Network error");
  }
};