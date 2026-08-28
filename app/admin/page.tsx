"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

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

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

const statusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  created: {
    label: "ایجاد شده",
    color: "bg-yellow-100 text-yellow-800",
    icon: "🟡",
  },
  inProgress: {
    label: "در حال انجام",
    color: "bg-blue-100 text-blue-800",
    icon: "🔄",
  },
  resolved: {
    label: "حل شده",
    color: "bg-green-100 text-green-800",
    icon: "✅",
  },
  cancelled: { label: "لغو شده", color: "bg-red-100 text-red-800", icon: "❌" },
};

const paymentStatusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  success: { label: "موفق", color: "bg-green-100 text-green-800", icon: "✅" },
  pending: {
    label: "در انتظار",
    color: "bg-yellow-100 text-yellow-800",
    icon: "⏳",
  },
  failed: { label: "ناموفق", color: "bg-red-100 text-red-800", icon: "❌" },
  internal_charge: {
    label: "شارژ داخلی",
    color: "bg-blue-100 text-blue-800",
    icon: "🔵",
  },
};

export default function AdminDashboardPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);

  // آمارها
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSpecialists, setTotalSpecialists] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [totalShifts, setTotalShifts] = useState(0);

  // لیست‌ها
  const [recentRequests, setRecentRequests] = useState<SupportRequest[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  // دریافت تعداد کاربران
  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // فرض می‌کنیم response شامل totalCount یا length هست
        const usersArray = Array.isArray(data)
          ? data
          : data.data || data.users || [];
        setTotalUsers(usersArray.length);
        // اگر API totalCount برگردوند، از اون استفاده کن
        if (data.totalCount) setTotalUsers(data.totalCount);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // دریافت تعداد متخصصان
  const fetchSpecialists = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/specialists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const specialistsArray = Array.isArray(data)
          ? data
          : data.data || data.specialists || [];
        setTotalSpecialists(specialistsArray.length);
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    }
  };

  // دریافت تراکنش‌ها
  const fetchPayments = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const paymentsArray = Array.isArray(data)
          ? data
          : data.data || data.payments || [];

        // محاسبه مجموع مبلغ تراکنش‌های موفق
        const total = paymentsArray
          .filter(
            (p: Payment) =>
              p.Status === "success" || p.Status === "internal_charge",
          )
          .reduce((sum: number, p: Payment) => sum + (p.Amount || 0), 0);
        setTotalPayments(total);

        // ۵ تراکنش آخر
        const sorted = [...paymentsArray].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
        );
        setRecentPayments(sorted.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  // دریافت درخواست‌های پشتیبانی
  const fetchSupportRequests = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/support-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const requestsArray = Array.isArray(data)
          ? data
          : data.data || data.requests || [];

        setTotalRequests(requestsArray.length);

        // تعداد درخواست‌های در انتظار (created یا inProgress)
        const pending = requestsArray.filter(
          (r: SupportRequest) =>
            r.Status === "created" || r.Status === "inProgress",
        ).length;
        setPendingRequests(pending);

        // ۴ درخواست آخر
        const sorted = [...requestsArray].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
        );
        setRecentRequests(sorted.slice(0, 4));
      }
    } catch (error) {
      console.error("Error fetching support requests:", error);
    }
  };

  // دریافت شیفت‌ها
  const fetchShifts = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/shifts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const shiftsArray = Array.isArray(data)
          ? data
          : data.data || data.shifts || [];
        setTotalShifts(shiftsArray.length);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  // بارگذاری همه داده‌ها
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center items-center w-full rounded-4xl mt-30">
        <h2 className="flex justify-center items-center text-2xl font-bold text-white bg-box-navbar bg w-150 max-md:w-100 h-20 mt-3 mb-3 rounded-b-full">
          ادمین عزیز خوش آمدید !
        </h2>
      </div>

      <div className="grid w-11/12 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 m-auto">
        <div className="bg-[--color-box] p-6 rounded-lg shadow h-80">
          <div className="flex justify-center text-8xl mb-2">👥</div>
          <h3 className="flex justify-center font-bold text-xl mt-10">
            کاربران
          </h3>
          <p className="flex justify-center font-bold text-2xl mt-10">
            {totalUsers.toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="bg-[--color-box] p-6 rounded-lg shadow h-80">
          <div className="flex justify-center text-8xl mb-2">👨‍⚕️</div>
          <h3 className="flex justify-center font-bold text-xl mt-10">
            متخصصان
          </h3>
          <p className="flex justify-center font-bold text-2xl mt-10">
            {totalSpecialists.toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="bg-[--color-box] p-6 rounded-lg shadow">
          <div className="flex justify-center text-8xl mb-2">💰</div>
          <h3 className="flex justify-center font-bold text-xl mt-10">
            تراکنش‌ها
          </h3>
          <div className="flex justify-center items-center gap-2 mt-7">
            <p className="flex justify-center items-center text-2xl font-bold mt-2">
              {formatAmount(totalPayments)}
            </p>
            <p className="flex text-lg text-green-600">تومان</p>
          </div>
        </div>

        <div className="bg-[--color-box] p-6 rounded-lg shadow">
          <div className="flex justify-center text-8xl mb-2">📝</div>
          <h3 className="flex justify-center font-bold text-xl mt-10">
            درخواست‌ها
          </h3>
          <p className="flex justify-center text-2xl font-bold mt-8">
            {totalRequests.toLocaleString("fa-IR")}
          </p>
          <p className="flex justify-center text-sm mt-5 text-orange-600 font-bold">
            {pendingRequests} در انتظار
          </p>
        </div>

        <div className="bg-[--color-box] p-6 rounded-lg shadow">
          <div className="flex justify-center text-8xl mb-2">📅</div>
          <h3 className="flex justify-center font-bold text-xl mt-10">
            شیفت ها
          </h3>
          <p className="flex justify-center text-2xl font-bold mt-8">
            {totalShifts.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      <div className="grid w-11/12 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8 m-auto">
        <div className="bg-[--color-box] p-6 rounded-lg shadow h-auto">
          <div className="flex gap-3 border-b-2">
            <p className="text-3xl">📋</p>
            <p className="font-bold text-lg pb-3 mt-1">
              درخواست‌های پشتیبانی اخیر
            </p>
          </div>
          {recentRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              هیچ درخواستی یافت نشد
            </p>
          ) : (
            recentRequests.map((req) => (
              <div
                key={req.ID}
                className="flex justify-between pt-3 pb-3 border-b-gray-900 border-b last:border-b-0"
              >
                <span className="flex justify-center items-center">
                  {req.ID} - {req.Customer?.name || "کاربر"}{" "}
                  {req.Customer?.lastName || ""}
                </span>
                <span
                  className={`p-2 rounded-lg ${statusConfig[req.Status]?.color || "bg-gray-100"}`}
                >
                  {statusConfig[req.Status]?.icon}{" "}
                  {statusConfig[req.Status]?.label || req.Status}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="bg-[--color-box] p-6 rounded-lg shadow h-auto">
          <div className="flex gap-4 border-b-2">
            <p className="text-3xl">💵</p>
            <p className="font-bold text-lg pb-3 mt-1">پرداخت‌های اخیر</p>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              هیچ پرداختی یافت نشد
            </p>
          ) : (
            recentPayments.map((payment) => (
              <div
                key={payment.ID}
                className="flex justify-between pt-8 pb-3 border-b-gray-900 border-b last:border-b-0"
              >
                <span>کاربر {payment.UserID}</span>
                <span>{formatAmount(payment.Amount)} تومان</span>
                <span
                  className={
                    paymentStatusConfig[payment.Status]?.color || "bg-gray-100"
                  }
                >
                  {paymentStatusConfig[payment.Status]?.icon}{" "}
                  {paymentStatusConfig[payment.Status]?.label || payment.Status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
