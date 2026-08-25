// // lib/api.ts
// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_URL || "https://your-api-domain.com";

// interface ApiResponse<T = any> {
//   success: boolean;
//   data?: T;
//   message?: string;
// }

// class ApiClient {
//   private async request<T>(
//     endpoint: string,
//     options: RequestInit = {},
//   ): Promise<ApiResponse<T>> {
//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("access_token")
//         : null;

//     const headers: HeadersInit = {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//       ...options.headers,
//     };

//     try {
//       const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//         ...options,
//         headers,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         // اگر توکن منقضی شده بود
//         if (response.status === 401) {
//           // تلاش برای رفرش توکن
//           const refreshed = await this.refreshToken();
//           if (refreshed) {
//             // دوباره درخواست رو با توکن جدید تکرار کن
//             return this.request<T>(endpoint, options);
//           } else {
//             // اگه رفرش نشد، کاربر رو به لاگین ببر
//             if (typeof window !== "undefined") {
//               localStorage.removeItem("access_token");
//               localStorage.removeItem("refresh_token");
//               localStorage.removeItem("user");
//               window.location.href = "/login";
//             }
//           }
//         }
//         return { success: false, message: data.message || "خطا در درخواست" };
//       }

//       return { success: true, data };
//     } catch (error) {
//       console.error("API Error:", error);
//       return { success: false, message: "مشکل در ارتباط با سرور" };
//     }
//   }

//   private async refreshToken(): Promise<boolean> {
//     const refreshToken = localStorage.getItem("refresh_token");
//     if (!refreshToken) return false;

//     try {
//       const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ refreshToken }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         localStorage.setItem("access_token", data.access_token);
//         if (data.refresh_token) {
//           localStorage.setItem("refresh_token", data.refresh_token);
//         }
//         return true;
//       }
//     } catch (error) {
//       console.error("Refresh token error:", error);
//     }
//     return false;
//   }

//   // متدهای عمومی
//   async get<T>(endpoint: string): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, { method: "GET" });
//   }

//   async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, {
//       method: "POST",
//       body: JSON.stringify(data),
//     });
//   }

//   async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, {
//       method: "PUT",
//       body: JSON.stringify(data),
//     });
//   }

//   async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, { method: "DELETE" });
//   }
// }

// export const apiClient = new ApiClient();

// // متدهای خاص مربوط به کاربر
// export const userApi = {
//   // دریافت پروفایل کاربر
//   getProfile: () => apiClient.get<any>("/v1/user/profile"),

//   // بروزرسانی پروفایل
//   updateProfile: (data: any) => apiClient.put("/v1/user/profile", data),

//   // دریافت درخواست‌های کاربر
//   getRequests: () => apiClient.get("/v1/user/requests"),

//   // دریافت کیف پول
//   getWallet: () => apiClient.get("/v1/user/wallet"),

//   // دریافت شیفت‌ها
//   getShifts: () => apiClient.get("/v1/user/shifts"),
// };
