import { ApiResponse } from "@/types";

const API_BASE_URL = "";  // Empty string for relative URLs

/**
 * Generic API request function
 */
export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    // For 204 No Content responses
    if (response.status === 204) {
      return { data: undefined };
    }

    const contentType = response.headers.get("content-type");
    const result = contentType?.includes("application/json") 
      ? await response.json() 
      : await response.text();

    if (!response.ok) {
      return {
        error: result.message || "An error occurred",
      };
    }

    return { data: result };
  } catch (error) {
    console.error("API request error:", error);
    return {
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * API utilities for each domain
 */
export const authApi = {
  register: (userData: any) => apiRequest("/api/auth/register", "POST", userData),
  login: (credentials: any) => apiRequest("/api/auth/login", "POST", credentials),
  adminLogin: (credentials: any) => apiRequest("/api/auth/admin-login", "POST", credentials),
  logout: () => apiRequest("/api/auth/logout", "POST"),
  getProfile: () => apiRequest("/api/auth/me"),
};

export const userApi = {
  update: (userId: number, userData: any) => apiRequest(`/api/users/${userId}`, "PUT", userData),
  updatePassword: (userId: number, passwordData: any) => 
    apiRequest(`/api/users/${userId}/password`, "PUT", passwordData),
  delete: (userId: number) => apiRequest(`/api/users/${userId}`, "DELETE"),
};

export const serviceApi = {
  getAll: () => apiRequest("/api/services"),
  getById: (serviceId: number) => apiRequest(`/api/services/${serviceId}`),
};

export const appointmentApi = {
  getAll: () => apiRequest("/api/appointments"),
  getByUser: (userId: number) => apiRequest(`/api/appointments?userId=${userId}`),
  getByDate: (date: string) => apiRequest(`/api/appointments?date=${date}`),
  getById: (appointmentId: number) => apiRequest(`/api/appointments/${appointmentId}`),
  create: (appointmentData: any) => apiRequest("/api/appointments", "POST", appointmentData),
  update: (appointmentId: number, appointmentData: any) => 
    apiRequest(`/api/appointments/${appointmentId}`, "PUT", appointmentData),
  delete: (appointmentId: number) => apiRequest(`/api/appointments/${appointmentId}`, "DELETE"),
  getAvailableSlots: (date: string, serviceId: number) => 
    apiRequest(`/api/available-slots?date=${date}&serviceId=${serviceId}`),
};

export const clientDetailApi = {
  getByUser: (userId: number) => apiRequest(`/api/client-details/${userId}`),
  update: (userId: number, detailData: any) => 
    apiRequest(`/api/client-details/${userId}`, "PUT", detailData),
};
