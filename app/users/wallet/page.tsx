"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

interface Payment {
  ID: number;
  UserID: number;
  Amount: number;
  Status: string;
  GatewayRef: string;
  CreatedAt: string;
}

interface BudgetInfo {
  budget: string;
  timeResult: {
    instant: { hour: number; minute: number };
    shortStay: { hour: number; minute: number };
    Schedulable: { hour: number; minute: number };
  };
}

export default function UserWalletPage() {
  const { user, getAccessToken } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [charging, setCharging] = useState(false);

  const formatAmount = (amount: number): string => {
    if (!amount && amount !== 0) return "۰";
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeResult = (hour: number, minute: number) => {
    if (hour === 0 && minute === 0) return "۰ ساعت";
    if (hour === 0) return `${minute} دقیقه`;
    if (minute === 0) return `${hour} ساعت`;
    return `${hour} ساعت و ${minute} دقیقه`;
  };

  const getStatusLabel = (status: string) => {
    if (status === "internal_charge") return "شارژ داخلی";
    if (status === "success") return "موفق";
    if (status === "pending") return "در انتظار";
    if (status === "failed") return "ناموفق";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "internal_charge") return "bg-blue-500/20 text-blue-200";
    if (status === "success") return "bg-green-500/20 text-green-200";
    if (status === "pending") return "bg-yellow-500/20 text-yellow-200";
    if (status === "failed") return "bg-red-500/20 text-red-200";
    return "bg-white/10 text-white/60";
  };

  const getStatusIcon = (status: string) => {
    if (status === "internal_charge") return "🔵";
    if (status === "success") return "✅";
    if (status === "pending") return "⏳";
    if (status === "failed") return "❌";
    return "📋";
  };

  // دریافت اطلاعات بودجه کاربر
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchBudgetInfo = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !user?.ID) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/users-information/budget-info`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: user.ID }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setBudgetInfo(data);
        setWalletBalance(parseInt(data.budget) || 0);
      }
    } catch (error) {
      console.error("Error fetching budget info:", error);
    }
  }, [user?.ID, getAccessToken]);

  // دریافت لیست تراکنش‌ها
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchPayments = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !user?.ID) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // فیلتر فقط تراکنش‌های کاربر جاری
        const userPayments = Array.isArray(data)
          ? data.filter((p: Payment) => p.UserID === user.ID)
          : [];
        setPayments(userPayments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [user?.ID, getAccessToken]);

  // ایجاد درخواست شارژ
  const createPayment = async (amount: number) => {
    const token = getAccessToken();
    if (!token || !user?.ID) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/payments/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.ID,
          amount: amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error creating payment:", error);
    }
    return null;
  };

  const confirmCharge = async () => {
    const amount =
      selectedAmount || (customAmount ? parseInt(customAmount) : 0);
    if (amount <= 0) return;

    setCharging(true);
    try {
      const payment = await createPayment(amount);
      if (payment) {
        if (payment.payment_url) {
          window.location.href = payment.payment_url;
        } else {
          alert(
            `✅ درخواست شارژ ${formatAmount(amount)} تومان با موفقیت ثبت شد`,
          );
          await fetchBudgetInfo();
          await fetchPayments();
          setShowChargeModal(false);
          setSelectedAmount(null);
          setCustomAmount("");
        }
      } else {
        alert("❌ خطا در ثبت درخواست شارژ");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ خطا در ارتباط با سرور");
    } finally {
      setCharging(false);
    }
  };

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2000000];
  const selectedAmountNumber =
    selectedAmount || (customAmount ? parseInt(customAmount) : 0);
  const totalCharged = payments
    .filter((p) => p.Status === "success" || p.Status === "internal_charge")
    .reduce((sum, p) => sum + (p.Amount || 0), 0);

  // لود کردن داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (user?.ID) {
        await Promise.all([fetchBudgetInfo(), fetchPayments()]);
      }
      setLoading(false);
    };
    loadData();
  }, [user?.ID, fetchBudgetInfo, fetchPayments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-950">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen from-blue-900 via-indigo-800 to-blue-950 p-4 md:p-6 relative overflow-hidden">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 container mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-30">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white/90">
            💰 کیف پول و تراکنش‌ها
          </h1>
          <p className="text-white/50 text-sm mt-1">
            شارژ کنید و دقیقاً ببینید چند ساعت دریافت می‌کنید
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💰</span>
              <span className="text-sm opacity-90">موجودی فعلی</span>
            </div>
            <p className="text-4xl font-bold">
              {formatAmount(walletBalance)}{" "}
              <span className="text-lg font-normal">تومان</span>
            </p>
            <button
              onClick={() => setShowChargeModal(true)}
              className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors border border-white/10"
            >
              + همین حالا شارژ کن
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💳</span>
              <span className="text-sm text-white/60">مجموع شارژ شده</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatAmount(totalCharged)}{" "}
              <span className="text-lg font-normal text-white/40">تومان</span>
            </p>
            <p className="text-xs text-white/30 mt-2">از ابتدا تاکنون</p>
          </div>
        </div>

        {/* معادل ساعت از بودجه موجود */}
        {budgetInfo?.timeResult && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⏱️</span>
              <h2 className="text-lg font-bold text-white/90">
                معادل ساعت پشتیبانی از بودجه موجود
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-indigo-400/20">
                <div className="text-2xl font-bold text-indigo-300">
                  {formatTimeResult(
                    budgetInfo.timeResult.instant.hour,
                    budgetInfo.timeResult.instant.minute,
                  )}
                </div>
                <div className="text-sm text-white/60">⚡ فوری</div>
              </div>
              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-green-400/20">
                <div className="text-2xl font-bold text-green-300">
                  {formatTimeResult(
                    budgetInfo.timeResult.shortStay.hour,
                    budgetInfo.timeResult.shortStay.minute,
                  )}
                </div>
                <div className="text-sm text-white/60">🏨 کوتاه‌مدت</div>
              </div>
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-blue-400/20">
                <div className="text-2xl font-bold text-blue-300">
                  {formatTimeResult(
                    budgetInfo.timeResult.Schedulable.hour,
                    budgetInfo.timeResult.Schedulable.minute,
                  )}
                </div>
                <div className="text-sm text-white/60">📅 زمان‌بندی شده</div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-lg font-bold text-white/90">
              📜 تاریخچه تراکنش‌ها
            </h2>
            <p className="text-white/40 text-sm">
              لیست تمام تراکنش‌های مالی شما
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50">هیچ تراکنشی یافت نشد</p>
              <button
                onClick={() => setShowChargeModal(true)}
                className="mt-4 px-4 py-2 text-blue-300 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition border border-blue-400/20"
              >
                اولین شارژ را انجام دهید
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                        تاریخ و زمان
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                        تراکنش
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                        مرجع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                        وضعیت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                        مبلغ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((payment) => (
                      <tr
                        key={payment.ID}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                          {formatDate(payment.CreatedAt)} -{" "}
                          {formatTime(payment.CreatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          تراکنش #{payment.ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50 font-mono">
                          {payment.GatewayRef || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.Status)}`}
                          >
                            {getStatusIcon(payment.Status)}{" "}
                            {getStatusLabel(payment.Status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-300">
                          +{formatAmount(payment.Amount)} تومان
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-white/10 max-h-[70vh] overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.ID} className="p-4 hover:bg-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-white/40">
                        {formatDate(payment.CreatedAt)} -{" "}
                        {formatTime(payment.CreatedAt)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(payment.Status)}`}
                      >
                        {getStatusIcon(payment.Status)}{" "}
                        {getStatusLabel(payment.Status)}
                      </span>
                    </div>
                    <div className="font-medium text-sm text-white/80 mb-1">
                      تراکنش #{payment.ID}
                    </div>
                    <div className="text-xs text-white/40 font-mono mb-2">
                      مرجع: {payment.GatewayRef || "—"}
                    </div>
                    <div className="text-base font-bold text-green-300">
                      +{formatAmount(payment.Amount)} تومان
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charge Modal */}
      {showChargeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowChargeModal(false)}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white/90">شارژ کیف پول</h2>
              <button
                onClick={() => setShowChargeModal(false)}
                className="text-white/40 hover:text-white/80 text-2xl transition"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Amounts */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  مبلغ مورد نظر (تومان)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={`py-2 px-3 rounded-lg border transition-all ${
                        selectedAmount === amount
                          ? "bg-blue-500/30 text-white border-blue-400"
                          : "bg-white/10 text-white/70 border-white/20 hover:border-white/40 hover:bg-white/20"
                      }`}
                    >
                      {formatAmount(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  مبلغ دلخواه
                </label>
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value.replace(/[^0-9]/g, ""));
                    setSelectedAmount(null);
                  }}
                  placeholder="مبلغ را وارد کنید"
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>

              {/* Total Amount */}
              {selectedAmountNumber > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">مبلغ قابل پرداخت:</span>
                    <span className="text-xl font-bold text-blue-300">
                      {formatAmount(selectedAmountNumber)} تومان
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowChargeModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition border border-white/10"
              >
                انصراف
              </button>
              <button
                onClick={confirmCharge}
                disabled={selectedAmountNumber === 0 || charging}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedAmountNumber > 0 && !charging
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {charging ? "در حال پردازش..." : "تایید و شارژ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
