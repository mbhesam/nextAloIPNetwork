"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!phoneNumber) {
      setError("لطفاً شماره تلفن را وارد کنید");
      setIsLoading(false);
      return;
    }

    if (loginMethod === "password" && !password) {
      setError("لطفاً رمز عبور را وارد کنید");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ذخیره در localStorage
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // فراخوانی login از AuthContext (همین کار رو انجام میده)
        login(data.access_token, data.refresh_token, {
          ID: data.user?.ID,
          name: data.user?.name,
          firstName: data.user?.firstName,
          lastName: data.user?.lastName,
          phoneNumber: data.user?.phoneNumber,
          email: data.user?.email,
          role: data.user?.role,
        });

        const userRole = data.user?.role;

        if (userRole === "admin") {
          router.push("/admin");
        } else if (userRole === "specialist") {
          router.push("/specialists");
        } else {
          router.push("/users");
        }
      } else {
        setError(data.message || "خطا در ورود به سیستم. لطفاً مجدد تلاش کنید.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("مشکلی در اتصال به سرور وجود دارد. لطفاً مجدد تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setError("لطفاً شماره تلفن را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        alert(`کد یکبارمصرف به شماره ${phoneNumber} ارسال شد`);
      } else {
        const data = await response.json();
        setError(data.message || "خطا در ارسال کد یکبارمصرف");
      }
    } catch (err) {
      setError("مشکلی در اتصال به سرور وجود دارد");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!otpCode) {
      setError("لطفاً کد یکبارمصرف را وارد کنید");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        login(data.access_token, data.refresh_token, {
          ID: data.user?.ID,
          name: data.user?.name,
          firstName: data.user?.firstName,
          lastName: data.user?.lastName,
          phoneNumber: data.user?.phoneNumber,
          email: data.user?.email,
          role: data.user?.role,
        });

        const userRole = data.user?.role;

        if (userRole === "admin") {
          router.push("/admin");
        } else if (userRole === "specialist") {
          router.push("/specialists");
        } else {
          router.push("/users");
        }
      } else {
        setError(data.message || "کد وارد شده صحیح نیست");
      }
    } catch (err) {
      setError("مشکلی در اتصال به سرور وجود دارد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌐</div>
          <h1 className="text-3xl font-bold text-gray-800">AloIPNetwork</h1>
          <p className="text-gray-500 mt-2">به حساب کاربری خود وارد شوید</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                loginMethod === "password"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              رمز عبور
            </button>
            <button
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                loginMethod === "otp"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ورود با کد یکبارمصرف
            </button>
          </div>

          <form
            onSubmit={
              loginMethod === "password" ? handleLogin : handleVerifyOtp
            }
            className="p-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره تلفن
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📞
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09121234567"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {loginMethod === "password" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔒
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور را وارد کنید"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    رمز عبور خود را فراموش کرده‌اید؟
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کد یکبارمصرف
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      ✉️
                    </span>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="کد ۶ رقمی را وارد کنید"
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      dir="ltr"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    ارسال کد
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  کد یکبارمصرف به شماره تلفن شما ارسال خواهد شد
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">مرا به خاطر بسپار</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ورود...</span>
                </div>
              ) : (
                "ورود"
              )}
            </button>
          </form>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              حساب کاربری ندارید؟{" "}
              <Link
                href="/register"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ثبت‌نام کنید
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ورود شما به معنای پذیرش{" "}
          <Link href="/terms" className="text-indigo-500 hover:underline">
            قوانین و مقررات
          </Link>{" "}
          است
        </p>
      </div>
    </div>
  );
}
