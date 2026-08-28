"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

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

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

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
    if (status === "internal_charge") return "bg-blue-100 text-blue-800";
    if (status === "success") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    if (status === "failed") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-30">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            💰 کیف پول و تراکنش‌ها
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            شارژ کنید و دقیقاً ببینید چند ساعت دریافت می‌کنید
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
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
              className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + همین حالا شارژ کن
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💳</span>
              <span className="text-sm text-gray-500">مجموع شارژ شده</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatAmount(totalCharged)}{" "}
              <span className="text-lg font-normal text-gray-500">تومان</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">از ابتدا تاکنون</p>
          </div>
        </div>

        {/* معادل ساعت از بودجه موجود */}
        {budgetInfo?.timeResult && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⏱️</span>
              <h2 className="text-lg font-bold text-gray-800">
                معادل ساعت پشتیبانی از بودجه موجود
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {formatTimeResult(
                    budgetInfo.timeResult.instant.hour,
                    budgetInfo.timeResult.instant.minute,
                  )}
                </div>
                <div className="text-sm text-gray-600">⚡ فوری</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatTimeResult(
                    budgetInfo.timeResult.shortStay.hour,
                    budgetInfo.timeResult.shortStay.minute,
                  )}
                </div>
                <div className="text-sm text-gray-600">🏨 کوتاه‌مدت</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTimeResult(
                    budgetInfo.timeResult.Schedulable.hour,
                    budgetInfo.timeResult.Schedulable.minute,
                  )}
                </div>
                <div className="text-sm text-gray-600">📅 زمان‌بندی شده</div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">
              📜 تاریخچه تراکنش‌ها
            </h2>
            <p className="text-gray-500 text-sm">
              لیست تمام تراکنش‌های مالی شما
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">هیچ تراکنشی یافت نشد</p>
              <button
                onClick={() => setShowChargeModal(true)}
                className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                اولین شارژ را انجام دهید
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاریخ و زمان
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تراکنش
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        مرجع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        وضعیت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        مبلغ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr
                        key={payment.ID}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(payment.CreatedAt)} -{" "}
                          {formatTime(payment.CreatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          تراکنش #{payment.ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          +{formatAmount(payment.Amount)} تومان
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.ID} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">
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
                    <div className="font-medium text-sm mb-1">
                      تراکنش #{payment.ID}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mb-2">
                      مرجع: {payment.GatewayRef || "—"}
                    </div>
                    <div className="text-base font-bold text-green-600">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setShowChargeModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">شارژ کیف پول</h2>
              <button
                onClick={() => setShowChargeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                      }`}
                    >
                      {formatAmount(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Total Amount */}
              {selectedAmountNumber > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">مبلغ قابل پرداخت:</span>
                    <span className="text-xl font-bold text-indigo-600">
                      {formatAmount(selectedAmountNumber)} تومان
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowChargeModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={confirmCharge}
                disabled={selectedAmountNumber === 0 || charging}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedAmountNumber > 0 && !charging
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
