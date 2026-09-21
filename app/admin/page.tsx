"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchDashboardPayments,
  fetchDashboardShifts,
  fetchDashboardSpecialists,
  fetchDashboardSupportRequests,
  fetchDashboardUsers,
} from "../lib/api/admin-dashboard";

interface User {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: string;
  budget: number;
}

interface Specialist {
  ID: number;
  userID: number;
  user?: User;
}

interface Payment {
  ID: number;
  UserID: number;
  Amount: number;
  Status: string;
  GatewayRef: string;
  CreatedAt: string;
  user?: User;
}

interface SupportRequest {
  ID: number;
  CustomerID: number;
  plan: string;
  Status: string;
  description: string;
  CreatedAt: string;
  Customer?: User;
}

interface Shift {
  ID: number;
  shiftDate: string;
  shiftTime: string;
  specialists: string[];
}

const statusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  created: {
    label: "ایجاد شده",
    color: "bg-yellow-500/20 text-white",
    icon: "🟡",
  },
  inProgress: {
    label: "در حال انجام",
    color: "bg-blue-500/20 text-white",
    icon: "🔄",
  },
  resolved: {
    label: "حل شده",
    color: "bg-green-500/20 text-white",
    icon: "✅",
  },
  cancelled: {
    label: "لغو شده",
    color: "bg-red-500/20 text-white",
    icon: "❌",
  },
};

const paymentStatusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  success: {
    label: "موفق",
    color: "bg-green-500/20 text-green-200",
    icon: "✅",
  },
  pending: {
    label: "در انتظار",
    color: "bg-yellow-500/20 text-yellow-200",
    icon: "⏳",
  },
  failed: { label: "ناموفق", color: "bg-red-500/20 text-red-200", icon: "❌" },
  internal_charge: {
    label: "شارژ داخلی",
    color: "bg-blue-500/20 text-blue-200",
    icon: "🔵",
  },
};

export default function AdminDashboardPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSpecialists, setTotalSpecialists] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [totalShifts, setTotalShifts] = useState(0);

  const [recentRequests, setRecentRequests] = useState<SupportRequest[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const fetchUsers = async (token: string) => {
    try {
      const usersArray = await fetchDashboardUsers(token);
      setTotalUsers(usersArray.length);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSpecialists = async (token: string) => {
    try {
      const specialistsArray = await fetchDashboardSpecialists(token);
      setTotalSpecialists(specialistsArray.length);
    } catch (error) {
      console.error("Error fetching specialists:", error);
    }
  };

  const fetchPayments = async (token: string) => {
    try {
      const paymentsArray = await fetchDashboardPayments(token);

      const total = paymentsArray
        .filter(
          (p: Payment) =>
            p.Status === "success" || p.Status === "internal_charge",
        )
        .reduce((sum: number, p: Payment) => sum + (p.Amount || 0), 0);
      setTotalPayments(total);

      const sorted = [...paymentsArray].sort(
        (a, b) =>
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      );
      setRecentPayments(sorted.slice(0, 5));
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchSupportRequests = async (token: string) => {
    try {
      const requestsArray = await fetchDashboardSupportRequests(token);

      setTotalRequests(requestsArray.length);

      const pending = requestsArray.filter(
        (r: SupportRequest) =>
          r.Status === "created" || r.Status === "inProgress",
      ).length;
      setPendingRequests(pending);

      const sorted = [...requestsArray].sort(
        (a, b) =>
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      );
      setRecentRequests(sorted.slice(0, 4));
    } catch (error) {
      console.error("Error fetching support requests:", error);
    }
  };

  const fetchShifts = async (token: string) => {
    try {
      const shiftsArray = await fetchDashboardShifts(token);
      setTotalShifts(shiftsArray.length);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchUsers(token),
        fetchSpecialists(token),
        fetchPayments(token),
        fetchSupportRequests(token),
        fetchShifts(token),
      ]);
      setLoading(false);
    };

    loadData();
    const refreshTimer = setInterval(loadData, 60_000);

    return () => clearInterval(refreshTimer);
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-6 relative overflow-hidden">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-center items-center w-full rounded-4xl mt-10 md:mt-20">
          <h2 className="flex justify-center items-center text-2xl font-bold text-white/90 bg-white/10 backdrop-blur-md border border-white/20 w-full max-w-md md:max-w-2xl h-20 mt-3 mb-3 rounded-b-full shadow-lg shadow-blue-500/10">
            ادمین عزیز خوش آمدید ! ✨
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8 max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-72 flex flex-col items-center justify-center transition-all hover:scale-105 hover:bg-white/15 duration-300">
            <div className="text-7xl mb-2">👥</div>
            <h3 className="font-bold text-xl text-white/90 mt-6">کاربران</h3>
            <p className="font-bold text-3xl text-white mt-6">
              {totalUsers.toLocaleString("fa-IR")}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-72 flex flex-col items-center justify-center transition-all hover:scale-105 hover:bg-white/15 duration-300">
            <div className="text-7xl mb-2">👨‍⚕️</div>
            <h3 className="font-bold text-xl text-white/90 mt-6">متخصصان</h3>
            <p className="font-bold text-3xl text-white mt-6">
              {totalSpecialists.toLocaleString("fa-IR")}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-72 flex flex-col items-center justify-center transition-all hover:scale-105 hover:bg-white/15 duration-300">
            <div className="text-7xl mb-2">💰</div>
            <h3 className="font-bold text-xl text-white/90 mt-6">تراکنش‌ها</h3>
            <div className="flex items-center gap-2 mt-4">
              <p className="text-2xl font-bold text-white">
                {formatAmount(totalPayments)}
              </p>
              <p className="text-sm text-green-300/80">تومان</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-72 flex flex-col items-center justify-center transition-all hover:scale-105 hover:bg-white/15 duration-300">
            <div className="text-7xl mb-2">📝</div>
            <h3 className="font-bold text-xl text-white/90 mt-6">درخواست‌ها</h3>
            <p className="text-3xl font-bold text-white mt-4">
              {totalRequests.toLocaleString("fa-IR")}
            </p>
            <p className="text-sm mt-3 text-orange-300/80 font-bold">
              {pendingRequests} در انتظار
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-72 flex flex-col items-center justify-center transition-all hover:scale-105 hover:bg-white/15 duration-300">
            <div className="text-7xl mb-2">📅</div>
            <h3 className="font-bold text-xl text-white/90 mt-6">شیفت‌ها</h3>
            <p className="text-3xl font-bold text-white mt-6">
              {totalShifts.toLocaleString("fa-IR")}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-auto transition-all hover:bg-white/15 duration-300">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-3xl">📋</span>
              <p className="font-bold text-lg text-white/90">
                درخواست‌های پشتیبانی اخیر
              </p>
            </div>
            {recentRequests.length === 0 ? (
              <p className="text-center text-white/40 py-8">
                هیچ درخواستی یافت نشد
              </p>
            ) : (
              recentRequests.map((req) => (
                <div
                  key={req.ID}
                  className="flex justify-between items-center pt-3 pb-3 border-b border-white/5 last:border-b-0"
                >
                  <span className="text-white/80">
                    {req.ID} - {req.Customer?.name || "کاربر"}{" "}
                    {req.Customer?.lastName || ""}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${statusConfig[req.Status]?.color || "bg-white/5 text-white/60"}`}
                  >
                    {statusConfig[req.Status]?.icon}{" "}
                    {statusConfig[req.Status]?.label || req.Status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl shadow-blue-500/5 p-6 h-auto transition-all hover:bg-white/15 duration-300">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-3xl">💵</span>
              <p className="font-bold text-lg text-white/90">پرداخت‌های اخیر</p>
            </div>
            {recentPayments.length === 0 ? (
              <p className="text-center text-white/40 py-8">
                هیچ پرداختی یافت نشد
              </p>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.ID}
                  className="flex justify-between items-center pt-3 pb-3 border-b border-white/5 last:border-b-0 flex-wrap gap-2"
                >
                  <span className="text-white/80">کاربر {payment.UserID}</span>
                  <span className="text-white/90 font-medium">
                    {formatAmount(payment.Amount)} تومان
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${
                      paymentStatusConfig[payment.Status]?.color ||
                      "bg-white/5 text-white/60"
                    }`}
                  >
                    {paymentStatusConfig[payment.Status]?.icon}{" "}
                    {paymentStatusConfig[payment.Status]?.label ||
                      payment.Status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
