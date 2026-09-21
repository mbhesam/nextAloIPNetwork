"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";

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
    <div className="min-h-screen flex items-center justify-center p-4  to-blue-950 relative overflow-hidden">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/aloip-network-logo.svg"
            width={240}
            height={64}
            alt="لوگوی AloIP Network"
            className="mx-auto mb-4"
          />
          <p className="text-white/50 mt-2">به حساب کاربری خود وارد شوید</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-4 text-center font-medium transition-all ${
                loginMethod === "password"
                  ? "text-white bg-white/10 border-b-2 border-blue-400"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              رمز عبور
            </button>
            <button
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 py-4 text-center font-medium transition-all ${
                loginMethod === "otp"
                  ? "text-white bg-white/10 border-b-2 border-blue-400"
                  : "text-white/50 hover:text-white/80"
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
              <label className="block text-sm font-medium text-white/80 mb-2">
                شماره تلفن
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                  📞
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09121234567"
                  className="w-full px-4 py-3 pr-10 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {loginMethod === "password" ? (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                    🔒
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور را وارد کنید"
                    className="w-full px-4 py-3 pr-10 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-300 hover:text-blue-200"
                  >
                    رمز عبور خود را فراموش کرده‌اید؟
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  کد یکبارمصرف
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                      ✉️
                    </span>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="کد ۶ رقمی را وارد کنید"
                      className="w-full px-4 py-3 pr-10 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                      dir="ltr"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors whitespace-nowrap disabled:opacity-50 backdrop-blur-sm"
                  >
                    ارسال کد
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  کد یکبارمصرف به شماره تلفن شما ارسال خواهد شد
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
                />
                <span className="text-sm text-white/60">مرا به خاطر بسپار</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
                isLoading
                  ? "bg-blue-500/50 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:shadow-xl"
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

          <div className="px-6 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10 text-center">
            <p className="text-sm text-white/60">
              حساب کاربری ندارید؟{" "}
              <Link
                href="/register"
                className="text-blue-300 hover:text-blue-200 font-medium"
              >
                ثبت‌نام کنید
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          ورود شما به معنای پذیرش{" "}
          <Link href="/terms" className="text-blue-300/60 hover:text-blue-300">
            قوانین و مقررات
          </Link>{" "}
          است
        </p>
      </div>
    </div>
  );
}
