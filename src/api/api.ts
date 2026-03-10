import { createClient } from "@supabase/supabase-js";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

const token = localStorage.getItem('access_token') || '';
// Base API configuration
export const API_CONFIG = {
    baseURL: supabaseUrl,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
};

// API Response types
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

// Error handling
export class ApiError extends Error {
    public status?: number;
    public code?: string;

    constructor(
        message: string,
        status?: number,
        code?: string
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

// Generic API request handler with pagination awareness
export const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T> | PaginatedResponse<T>> => {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
            ...options,
            headers: {
                ...API_CONFIG.headers,
                ...options.headers,
            },
        });

        // ❌ HTTP error
        if (!response.ok) {
            let errorMessage = `API request failed: ${response.statusText}`;

            try {
                const text = await response.text();
                if (text) {
                    const errorData = JSON.parse(text);
                    if (errorData?.error) {
                        errorMessage = `API request failed: ${errorData.error}`;
                    }
                    console.error("API Error Details:", errorData);
                }
            } catch {
                // Ignore JSON parse error
            }

            throw new ApiError(errorMessage, response.status);
        }

        // ✅ 204 No Content (DELETE, etc.)
        if (response.status === 204) {
            return { data: null as T };
        }

        // ✅ Handle empty body safely
        const text = await response.text();
        if (!text) {
            return { data: null as T };
        }

        const data = JSON.parse(text);

        // ✅ Pagination support
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
