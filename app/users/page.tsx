"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../lib/api";
import {
  createSupportRequest as createSupportRequestApi,
  fetchCategories as fetchCategoriesApi,
  fetchCostSettings as fetchCostSettingsApi,
  fetchSupportRequestById as fetchSupportRequestByIdApi,
  fetchSupportRequests as fetchSupportRequestsApi,
  fetchUserBudget as fetchUserBudgetApi,
} from "../lib/api/user-dashboard";
import RequestStatusBadge from "./components/RequestStatusBadge";

interface User {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: string;
  budget: number;
  melliCode: string;
  state: string;
  city: string;
}

interface CostSetting {
  ID: number;
  Plan: string;
  CostPerHour: number | null;
  FixedPrice: number | null;
}

interface Plan {
  name: string;
  label: string;
  icon: string;
  costPerHour: number | null;
  fixedPrice: number | null;
}



const statusConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
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
  cancelled: {
    label: "لغو شده",
    color: "bg-red-100 text-red-800",
    icon: "❌",
  },
};

const planLabels: Record<string, string> = {
  instant: "فوری",
  shortStay: "کوتاه‌مدت",
  schedulable: "زمان‌بندی شده",
  platformPublished: "پلتفرم",
  inPerson: "حضوری",
};

const planIcons: Record<string, string> = {
  instant: "⚡",
  shortStay: "🏨",
  schedulable: "📅",
  platformPublished: "💻",
  inPerson: "🏢",
};

const toEnglishNumber = (value: string | number): string =>
  String(value)
    .replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));

const toPersianDigits = (value: string | number): string =>
  String(value).replace(/\d/g, (char) => "۰۱۲۳۴۵۶۷۸۹"[Number(char)]);

/* ==================== شمسی ==================== */

const toPersianDate = (
  date: Date,
): {
  year: number;
  month: number;
  day: number;
} => {
  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1;
  const gd = date.getUTCDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  const gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);

  days %= 12053;

  jy += 4 * Math.floor(days / 1461);

  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm = 1;
  let jd = 1;

  const jDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  for (let i = 0; i < 12; i++) {
    if (days >= jDays[i]) {
      days -= jDays[i];
      jm++;
    } else {
      jd = days + 1;
      break;
    }
  }

  return {
    year: jy,
    month: jm,
    day: jd,
  };
};

/* ==================== شمسی به میلادی ==================== */

const convertPersianToGregorian = (
  jy: number,
  jm: number,
  jd: number,
): Date => {
  const baseDate = new Date(Date.UTC(2021, 2, 21, 0, 0, 0));

  const monthDays = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let daysInYear = 0;

  for (let i = 1; i < jm; i++) {
    daysInYear += monthDays[i];
  }

  daysInYear += jd - 1;

  const yearsDiff = jy - 1400;

  let totalDays = yearsDiff * 365 + Math.floor((yearsDiff + 1) / 4);

  totalDays += daysInYear;

  const result = new Date(baseDate);

  result.setUTCDate(result.getUTCDate() + totalDays);

  return result;
};

/* ==================== ماه‌های شمسی ==================== */

const getPersianMonths = () => [
  { value: 1, label: "فروردین" },
  { value: 2, label: "اردیبهشت" },
  { value: 3, label: "خرداد" },
  { value: 4, label: "تیر" },
  { value: 5, label: "مرداد" },
  { value: 6, label: "شهریور" },
  { value: 7, label: "مهر" },
  { value: 8, label: "آبان" },
  { value: 9, label: "آذر" },
  { value: 10, label: "دی" },
  { value: 11, label: "بهمن" },
  { value: 12, label: "اسفند" },
];

/* ==================== روزهای شمسی ==================== */

const getPersianDays = (month: number) => {
  const days = month <= 6 ? 31 : month <= 11 ? 30 : 30;

  return Array.from({ length: days }, (_, index) => index + 1);
};

/* ==================== سال‌های شمسی ==================== */

const getPersianYears = () => {
  const currentYear = toPersianDate(new Date()).year;

  return Array.from({ length: 11 }, (_, index) => currentYear + index);
};

/* ==================== فرمت تاریخ شمسی ==================== */

const formatPersianDate = (year: number, month: number, day: number) => {
  const monthName =
    getPersianMonths().find((m) => m.value === month)?.label || "";

  return `${toPersianDigits(year)} ${monthName} ${toPersianDigits(day)}`;
};

/* ==================== ساخت scheduledStart ==================== */

const createScheduledStartForAPI = (
  year: number,
  month: number,
  day: number,
  time: string,
): string => {
  const gregorianDate = convertPersianToGregorian(year, month, day);

  const [hours, minutes] = time.split(":").map(Number);

  const iranDate = new Date(
    Date.UTC(
      gregorianDate.getUTCFullYear(),
      gregorianDate.getUTCMonth(),
      gregorianDate.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );

  iranDate.setUTCMinutes(iranDate.getUTCMinutes() - 210);

  const yearString = iranDate.getUTCFullYear();

  const monthString = String(iranDate.getUTCMonth() + 1).padStart(2, "0");

  const dayString = String(iranDate.getUTCDate()).padStart(2, "0");

  const hourString = String(iranDate.getUTCHours()).padStart(2, "0");

  const minuteString = String(iranDate.getUTCMinutes()).padStart(2, "0");

  return `${yearString}-${monthString}-${dayString}T${hourString}:${minuteString}:00`;
};

/* ==================== Parse UTC ==================== */

const parseScheduledStartAsUTC = (value: any): Date | null => {
  if (!value) return null;

  try {
    let text = String(value).trim();

    if (!text) return null;

    if (!text.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(text)) {
      text += "Z";
    }

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

/* ==================== نمایش تاریخ نوبت ==================== */

const formatScheduledDateTime = (value: any) => {
  const utcDate = parseScheduledStartAsUTC(value);

  if (!utcDate) return "—";

  try {
    const iranDate = new Date(utcDate.getTime() + 210 * 60 * 1000);

    const persian = toPersianDate(iranDate);

    const monthName =
      getPersianMonths().find((m) => m.value === persian.month)?.label || "";

    const hours = String(iranDate.getUTCHours()).padStart(2, "0");

    const minutes = String(iranDate.getUTCMinutes()).padStart(2, "0");

    return `${toPersianDigits(persian.year)} ${monthName} ${toPersianDigits(
      persian.day,
    )} - ساعت ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
  } catch {
    return "—";
  }
};

/* ==================== فقط تاریخ ==================== */

const formatScheduledDate = (value: any) => {
  const utcDate = parseScheduledStartAsUTC(value);

  if (!utcDate) return "—";

  try {
    const iranDate = new Date(utcDate.getTime() + 210 * 60 * 1000);

    const persian = toPersianDate(iranDate);

    const monthName =
      getPersianMonths().find((m) => m.value === persian.month)?.label || "";

    return `${toPersianDigits(persian.year)} ${monthName} ${toPersianDigits(
      persian.day,
    )}`;
  } catch {
    return "—";
  }
};

/* ==================== فقط ساعت ==================== */

const formatScheduledTime = (value: any) => {
  const utcDate = parseScheduledStartAsUTC(value);

  if (!utcDate) return "—";

  try {
    const iranDate = new Date(utcDate.getTime() + 210 * 60 * 1000);

    const hours = String(iranDate.getUTCHours()).padStart(2, "0");

    const minutes = String(iranDate.getUTCMinutes()).padStart(2, "0");

    return `${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
  } catch {
    return "—";
  }
};

/* ==================== تاریخ ایجاد ==================== */

const formatApiDateToPersian = (value: any) => {
  if (!value) return "—";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const persian = toPersianDate(date);

    const monthName =
      getPersianMonths().find((m) => m.value === persian.month)?.label || "";

    return `${toPersianDigits(persian.year)} ${monthName} ${toPersianDigits(
      persian.day,
    )}`;
  } catch {
    return "—";
  }
};

/* ====================================================== */

export default function UserDashboardPage() {
  const { user: authUser, getAccessToken } = useAuth();

  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [costSettings, setCostSettings] = useState<CostSetting[]>([]);

  const [loadingCosts, setLoadingCosts] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);

  const [requests, setRequests] = useState<any[]>([]);

  const [allRequestsState, setAllRequestsState] = useState<any[]>([]);

  const [loadingRequests, setLoadingRequests] = useState(false);

  const [showAllRequests, setShowAllRequests] = useState(false);

  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const today = toPersianDate(new Date());

  const [selectedYear, setSelectedYear] = useState(today.year);

  const [selectedMonth, setSelectedMonth] = useState(today.month);

  const [selectedDay, setSelectedDay] = useState(today.day);

  const [selectedTime, setSelectedTime] = useState("09:00");

  const [newRequest, setNewRequest] = useState({
    plan: "",
    category: "",
    description: "",
    anyDeskCode: "",
  });

  const [walletBalance, setWalletBalance] = useState(0);

  /* ==================== قیمت ==================== */

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    const normalized = String(value)
      .replace(/,/g, "")
      .replace(/٬/g, "")
      .replace(/٫/g, ".")
      .replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
      .trim();

    const result = Number(normalized);

    return Number.isNaN(result) ? 0 : result;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("fa-IR").format(parseNumber(amount));
  };

  /* ==================== Plan ها ==================== */

  const plans: Plan[] = costSettings.reduce<Plan[]>((result, setting) => {
    const existing = result.find((item) => item.name === setting.Plan);

    if (!existing) {
      result.push({
        name: setting.Plan,
        label: planLabels[setting.Plan] || setting.Plan,
        icon: planIcons[setting.Plan] || "📋",
        costPerHour: setting.CostPerHour,
        fixedPrice: setting.FixedPrice,
      });
    }

    return result;
  }, []);

  const getPlanPrice = (planName: string): number => {
    const plan = plans.find((item) => item.name === planName);

    if (!plan) return 0;

    if (plan.costPerHour !== null && plan.costPerHour !== undefined) {
      return parseNumber(plan.costPerHour);
    }

    if (plan.fixedPrice !== null && plan.fixedPrice !== undefined) {
      return parseNumber(plan.fixedPrice);
    }

    return 0;
  };

  const isDateRequired = (planName: string) => {
    return planName === "schedulable";
  };

  /* ==================== بودجه ==================== */

  const fetchBudgetInfo = useCallback(async () => {
    const token = getAccessToken();

    if (!token || !user?.ID) return;

    try {
      const budget = await fetchUserBudgetApi(token, user.ID);

      if (budget !== null) {
        setWalletBalance(budget);
      }
    } catch (error) {
      console.error("Budget error:", error);
    }
  }, [user?.ID, getAccessToken]);

  /* ==================== درخواست‌ها ==================== */

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchRequests = useCallback(async () => {
    const token = getAccessToken();

    if (!token || !user?.ID) return;

    setLoadingRequests(true);

    try {
      const sorted = await fetchSupportRequestsApi(token, user.ID);

      setRequests(sorted.slice(0, 3));
      setAllRequestsState(sorted);
    } catch (error) {
      console.error("Requests error:", error);
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.ID, getAccessToken]);

  /* ==================== ثبت درخواست ==================== */

  const handleSubmitNewRequest = async () => {
    if (!newRequest.plan) {
      alert("لطفاً طرح پشتیبانی را انتخاب کنید");
      return;
    }

    if (!newRequest.category) {
      alert("لطفاً دسته‌بندی را انتخاب کنید");
      return;
    }

    if (!newRequest.description.trim()) {
      alert("لطفاً شرح درخواست را وارد کنید");
      return;
    }

    if (!newRequest.anyDeskCode.trim()) {
      alert("لطفاً کد AnyDesk را وارد کنید");
      return;
    }

    if (isDateRequired(newRequest.plan)) {
      if (!selectedYear || !selectedMonth || !selectedDay) {
        alert("لطفاً تاریخ مورد نظر را انتخاب کنید");
        return;
      }

      if (!selectedTime) {
        alert("لطفاً ساعت مورد نظر را انتخاب کنید");
        return;
      }
    }

    const token = getAccessToken();

    if (!token) {
      alert("لطفاً دوباره وارد شوید");
      return;
    }

    if (!user?.ID) {
      alert("اطلاعات کاربر یافت نشد");
      return;
    }

    setLoadingRequests(true);

    try {
      const requestBody: any = {
        customerId: user.ID,
        categoryId: Number(newRequest.category),
        description: newRequest.description.trim(),
        plan: newRequest.plan,
        anyDeskCode: newRequest.anyDeskCode.trim(),
      };

      if (isDateRequired(newRequest.plan)) {
        const scheduledStart = createScheduledStartForAPI(
          selectedYear,
          selectedMonth,
          selectedDay,
          selectedTime,
        );

        const startDate = parseScheduledStartAsUTC(scheduledStart);

        if (!startDate) {
          alert("تاریخ نوبت نامعتبر است");

          setLoadingRequests(false);
          return;
        }

        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        const scheduledEnd = `${endDate.getUTCFullYear()}-${String(
          endDate.getUTCMonth() + 1,
        ).padStart(2, "0")}-${String(endDate.getUTCDate()).padStart(
          2,
          "0",
        )}T${String(endDate.getUTCHours()).padStart(2, "0")}:${String(
          endDate.getUTCMinutes(),
        ).padStart(2, "0")}:00`;

        requestBody.scheduledStart = scheduledStart;

        requestBody.scheduledEnd = scheduledEnd;
      }

      const { ok, responseText } = await createSupportRequestApi(
        token,
        user.ID,
        requestBody,
      );

      if (ok) {
        alert("✅ درخواست شما با موفقیت ثبت شد");

        setShowNewRequestModal(false);

        setNewRequest({
          plan: plans[0]?.name || "",
          category: "",
          description: "",
          anyDeskCode: "",
        });

        const current = toPersianDate(new Date());

        setSelectedYear(current.year);

        setSelectedMonth(current.month);

        setSelectedDay(current.day);

        setSelectedTime("09:00");

        await fetchRequests();
        await fetchBudgetInfo();
      } else {
        alert(`❌ خطا: ${responseText}`);
      }
    } catch (error) {
      console.error(error);

      alert("❌ خطا در ارتباط با سرور");
    } finally {
      setLoadingRequests(false);
    }
  };

  /* ==================== مشاهده درخواست ==================== */

  const handleViewRequest = async (request: any) => {
    setSelectedRequest(request);

    const token = getAccessToken();

    if (!token) return;

    try {
      const requestId = request.ID ?? request.id;

      const data = await fetchSupportRequestByIdApi(token, requestId);

      if (data) {
        setSelectedRequest(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setShowAllRequests(false);
  };

  /* ==================== Cost Settings ==================== */

  useEffect(() => {
    const loadCostSettings = async () => {
      const token = getAccessToken();

      if (!token) return;

      try {
        const settings: CostSetting[] = await fetchCostSettingsApi(token);

        setCostSettings(settings);

        if (settings.length > 0) {
          setNewRequest((prev) => ({
            ...prev,
            plan: prev.plan || settings[0].Plan,
          }));
        }
      } catch (error) {
        console.error("Cost settings error:", error);
      } finally {
        setLoadingCosts(false);
      }
    };

    void loadCostSettings();
  }, [getAccessToken]);

  /* ==================== Categories ==================== */

  useEffect(() => {
    const loadCategories = async () => {
      const token = getAccessToken();

      if (!token) return;

      try {
        const data = await fetchCategoriesApi(token);
        setCategories(data);
      } catch (error) {
        console.error("Categories error:", error);
      }
    };

    void loadCategories();
  }, [getAccessToken]);

  /* ==================== User ==================== */

  useEffect(() => {
    try {
      if (authUser) {
        setUser(authUser as unknown as User);
      } else {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  /* ==================== Dashboard ==================== */

  useEffect(() => {
    if (user?.ID) {
      fetchBudgetInfo();
      fetchRequests();
    }
  }, [user?.ID, fetchBudgetInfo, fetchRequests]);

  /* ==================== ساعت پشتیبانی ==================== */

  const getSafeHours = (planName: string) => {
    const price = getPlanPrice(planName);

    if (!price || price <= 0) {
      return 0;
    }

    return Math.floor(walletBalance / price);
  };

  const supportHours = plans.reduce<Record<string, number>>((result, plan) => {
    result[plan.name] = getSafeHours(plan.name);

    return result;
  }, {});

  const activeRequests = requests.filter(
    (r) => r.Status === "inProgress" || r.Status === "created",
  ).length;

  const completedRequests = requests.filter(
    (r) => r.Status === "resolved" || r.Status === "cancelled",
  ).length;

  const fullName =
    user?.name && user?.lastName
      ? `${user.name} ${user.lastName}`
      : user?.name || user?.phoneNumber || "کاربر";

  if (isLoading || loadingCosts) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gray-100"
        dir="rtl"
      >
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-30">
        {/* ==================== Header ==================== */}

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold">
            خوش آمدید، {fullName} عزیز!
          </h1>

          <p className="text-indigo-100 mt-2 text-sm">
            طرح‌های پشتیبانی و هزینه آن‌ها از سرور دریافت می‌شوند.
          </p>
        </div>

        {/* ==================== Wallet ==================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">💰</span>

                <h2 className="text-lg font-semibold text-gray-700">
                  موجودی کیف پول
                </h2>
              </div>

              <button className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm">
                + شارژ
              </button>
            </div>

            <p className="text-3xl font-bold text-gray-900">
              {formatAmount(walletBalance)} تومان
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <div className="flex items-center justify-center gap-2 mb-4 bg-blue-400 p-3 rounded-xl">
              <span className="text-2xl">⏱️</span>

              <h2 className="text-lg font-semibold text-black">
                معادل ساعت پشتیبانی
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {plans.map((plan) => (
                <div key={plan.name}>
                  <div className="text-2xl font-bold text-indigo-600">
                    {supportHours[plan.name]}
                  </div>

                  <div className="text-sm">
                    {plan.icon} {plan.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== Stats ==================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎫</span>

                  <span className="text-sm">درخواست فعال</span>
                </div>

                <p className="text-4xl font-bold">{activeRequests}</p>
              </div>

              <button
                onClick={() => setShowNewRequestModal(true)}
                className="bg-white/20 px-4 py-2 rounded-lg text-sm"
              >
                + درخواست جدید
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>

                  <span className="text-sm">تکمیل/بسته شده</span>
                </div>

                <p className="text-4xl font-bold">{completedRequests}</p>
              </div>

              <button
                onClick={() => setShowAllRequests(true)}
                className="bg-white/20 px-4 py-2 rounded-lg text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>
        </div>

        {/* ==================== Requests ==================== */}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">آخرین درخواست‌های پشتیبانی</h2>

              <p className="text-gray-500 text-sm">درخواست‌های اخیر شما</p>
            </div>

            <button
              onClick={() => setShowAllRequests(true)}
              className="text-indigo-600 text-sm"
            >
              مشاهده همه ←
            </button>
          </div>

          {loadingRequests ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs">شناسه</th>

                    <th className="px-6 py-3 text-right text-xs">طرح</th>

                    <th className="px-6 py-3 text-right text-xs">وضعیت</th>

                    <th className="px-6 py-3 text-right text-xs">
                      تاریخ ایجاد
                    </th>

                    <th className="px-6 py-3 text-right text-xs">نوبت</th>

                    <th className="px-6 py-3 text-right text-xs">عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((req) => (
                    <tr key={req.ID ?? req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">#{req.ID ?? req.id}</td>

                      <td className="px-6 py-4 text-sm">
                        {planIcons[req.plan] || "📋"}{" "}
                        {planLabels[req.plan] || req.plan}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            statusConfig[req.Status]?.color ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusConfig[req.Status]?.icon}{" "}
                          {statusConfig[req.Status]?.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {formatApiDateToPersian(req.CreatedAt ?? req.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-blue-700">
                        {isDateRequired(req.plan)
                          ? formatScheduledDateTime(
                              req.scheduledStart ?? req.ScheduledStart,
                            )
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleViewRequest(req)}
                          className="text-indigo-600"
                        >
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {requests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  هیچ درخواستی یافت نشد
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          درخواست جدید
      ========================================================= */}

      {showNewRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowNewRequestModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}

            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  درخواست جدید
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  طرح موردنظر خود را انتخاب کنید
                </p>
              </div>

              <button
                onClick={() => setShowNewRequestModal(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-2xl transition"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* ==================== PLAN ==================== */}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  طرح پشتیبانی <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((plan) => {
                    const isSelected = newRequest.plan === plan.name;

                    const price =
                      plan.fixedPrice !== null && plan.fixedPrice !== undefined
                        ? formatAmount(plan.fixedPrice)
                        : formatAmount(plan.costPerHour || 0);

                    const priceText =
                      plan.fixedPrice !== null && plan.fixedPrice !== undefined
                        ? "هزینه ثابت"
                        : "به ازای هر ساعت";

                    return (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() =>
                          setNewRequest((prev) => ({
                            ...prev,
                            plan: plan.name,
                          }))
                        }
                        className={`
                            relative w-full text-right rounded-2xl border-2 p-4
                            transition-all duration-200
                            ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100 scale-[1.01]"
                                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50 hover:shadow-md"
                            }
                          `}
                      >
                        {isSelected && (
                          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            ✓
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <div
                            className={`
                                flex-shrink-0
                                w-12 h-12
                                rounded-xl
                                flex items-center justify-center
                                text-2xl
                                transition
                                ${
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-gray-100"
                                }
                              `}
                          >
                            {plan.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`
                                  font-bold text-base
                                  ${
                                    isSelected
                                      ? "text-indigo-700"
                                      : "text-gray-800"
                                  }
                                `}
                            >
                              {plan.label}
                            </div>

                            <div className="mt-2 flex items-baseline gap-1">
                              <span
                                className={`
                                    text-lg font-bold
                                    ${
                                      isSelected
                                        ? "text-indigo-700"
                                        : "text-gray-900"
                                    }
                                  `}
                              >
                                {price}
                              </span>

                              <span className="text-xs text-gray-500">
                                تومان
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 mt-1">
                              {priceText}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-indigo-200">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700">
                              <span>✓</span>

                              <span>این طرح انتخاب شده است</span>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!newRequest.plan && (
                  <p className="text-xs text-gray-500 mt-2">
                    لطفاً یکی از طرح‌های پشتیبانی را انتخاب کنید.
                  </p>
                )}

                {newRequest.plan && (
                  <div className="mt-3 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-indigo-700">
                        طرح انتخاب‌شده
                      </span>

                      <span className="font-bold text-indigo-800">
                        {plans.find((p) => p.name === newRequest.plan)?.icon}{" "}
                        {plans.find((p) => p.name === newRequest.plan)?.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================== تاریخ ==================== */}

              {isDateRequired(newRequest.plan) && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-4">
                  <div className="bg-white rounded-xl p-3 text-center border border-blue-200">
                    <div className="text-xs text-gray-500 mb-1">
                      تاریخ و ساعت انتخاب شده
                    </div>

                    <div className="text-lg font-bold text-blue-700">
                      {formatPersianDate(
                        selectedYear,
                        selectedMonth,
                        selectedDay,
                      )}
                    </div>

                    <div className="text-lg font-bold text-blue-700 mt-1">
                      ساعت {toPersianDigits(selectedTime)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      تاریخ شمسی *
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <select
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(
                              Number(toEnglishNumber(e.target.value)),
                            )
                          }
                          className="w-full p-2 border border-blue-300 rounded-lg bg-white text-center"
                        >
                          {getPersianYears().map((year) => (
                            <option key={year} value={year}>
                              {toPersianDigits(year)}
                            </option>
                          ))}
                        </select>

                        <p className="text-xs text-center text-gray-500 mt-1">
                          سال
                        </p>
                      </div>

                      <div>
                        <select
                          value={selectedMonth}
                          onChange={(e) => {
                            const month = Number(e.target.value);

                            setSelectedMonth(month);

                            const days = getPersianDays(month);

                            if (selectedDay > days.length) {
                              setSelectedDay(days.length);
                            }
                          }}
                          className="w-full p-2 border border-blue-300 rounded-lg bg-white text-center"
                        >
                          {getPersianMonths().map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>

                        <p className="text-xs text-center text-gray-500 mt-1">
                          ماه
                        </p>
                      </div>

                      <div>
                        <select
                          value={selectedDay}
                          onChange={(e) =>
                            setSelectedDay(Number(e.target.value))
                          }
                          className="w-full p-2 border border-blue-300 rounded-lg bg-white text-center"
                        >
                          {getPersianDays(selectedMonth).map((day) => (
                            <option key={day} value={day}>
                              {toPersianDigits(day)}
                            </option>
                          ))}
                        </select>

                        <p className="text-xs text-center text-gray-500 mt-1">
                          روز
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      ساعت نوبت *
                    </label>

                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full p-2 border border-blue-300 rounded-lg bg-white text-left"
                      step="900"
                      dir="ltr"
                    />
                  </div>

                  <div className="text-xs text-blue-600 bg-blue-100 rounded-lg p-2">
                    ساعت واردشده به وقت ایران است و هنگام ثبت، به UTC تبدیل
                    می‌شود.
                  </div>
                </div>
              )}

              {/* ==================== Category ==================== */}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  دسته‌بندی <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <select
                    value={newRequest.category}
                    onChange={(e) =>
                      setNewRequest((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="
                      w-full
                      h-11
                      px-4
                      pl-10
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      text-gray-800
                      outline-none
                      cursor-pointer
                      transition-all
                      appearance-none
                      focus:border-indigo-500
                      focus:bg-white
                      focus:ring-2
                      focus:ring-indigo-100
                      hover:border-indigo-300
                    "
                  >
                    <option value="">انتخاب دسته‌بندی...</option>

                    {categories.map((cat: any) => (
                      <option key={cat.ID ?? cat.id} value={cat.ID ?? cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* فلش */}

                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {newRequest.category && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      ✓
                    </span>

                    <span>
                      دسته‌بندی انتخاب شد:{" "}
                      <strong>
                        {
                          categories.find(
                            (cat: any) =>
                              String(cat.ID ?? cat.id) ===
                              String(newRequest.category),
                          )?.name
                        }
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* ==================== Description ==================== */}

              <div>
                <label className="block text-sm font-medium mb-2">
                  شرح درخواست <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={newRequest.description}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مشکل خود را توضیح دهید..."
                />
              </div>

              {/* ==================== AnyDesk ==================== */}

              <div>
                <label className="block text-sm font-medium mb-2">
                  کد AnyDesk <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={newRequest.anyDeskCode}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      anyDeskCode: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: 123456789"
                  dir="ltr"
                />
              </div>

              {/* ==================== Wallet ==================== */}

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-sm text-blue-800">
                  💰 موجودی کیف پول:{" "}
                  <strong>{formatAmount(walletBalance)}</strong> تومان
                </p>

                {newRequest.plan && (
                  <p className="text-xs text-blue-600 mt-1">
                    هزینه این طرح:{" "}
                    <strong>
                      {formatAmount(getPlanPrice(newRequest.plan))} تومان
                    </strong>
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition"
              >
                انصراف
              </button>

              <button
                onClick={handleSubmitNewRequest}
                disabled={loadingRequests}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition"
              >
                {loadingRequests ? "در حال ثبت..." : "ثبت درخواست"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== همه درخواست‌ها ==================== */}

      {showAllRequests && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">همه درخواست‌های پشتیبانی</h2>

              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs">شناسه</th>

                    <th className="px-6 py-3 text-right text-xs">طرح</th>

                    <th className="px-6 py-3 text-right text-xs">وضعیت</th>

                    <th className="px-6 py-3 text-right text-xs">
                      تاریخ ایجاد
                    </th>

                    <th className="px-6 py-3 text-right text-xs">تاریخ نوبت</th>

                    <th className="px-6 py-3 text-right text-xs">ساعت نوبت</th>

                    <th className="px-6 py-3 text-right text-xs">عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {allRequestsState.map((req) => (
                    <tr key={req.ID ?? req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">#{req.ID ?? req.id}</td>

                      <td className="px-6 py-4 text-sm">
                        {planIcons[req.plan] || "📋"}{" "}
                        {planLabels[req.plan] || req.plan}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            statusConfig[req.Status]?.color ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusConfig[req.Status]?.icon}{" "}
                          {statusConfig[req.Status]?.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {formatApiDateToPersian(req.CreatedAt ?? req.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-blue-700">
                        {isDateRequired(req.plan)
                          ? formatScheduledDate(
                              req.scheduledStart ?? req.ScheduledStart,
                            )
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-blue-700">
                        {isDateRequired(req.plan)
                          ? formatScheduledTime(
                              req.scheduledStart ?? req.ScheduledStart,
                            )
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            handleViewRequest(req);

                            setShowAllRequests(false);
                          }}
                          className="text-indigo-600"
                        >
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== جزئیات درخواست ==================== */}

      {selectedRequest && !showAllRequests && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده درخواست</h2>

              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">شناسه</label>

                  <p>#{selectedRequest.ID ?? selectedRequest.id}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">وضعیت</label>

                  <p>
                    <RequestStatusBadge
                      status={selectedRequest.Status}
                      statusConfig={statusConfig}
                    />
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">طرح</label>

                  <p>
                    {planIcons[selectedRequest.plan]}{" "}
                    {planLabels[selectedRequest.plan] || selectedRequest.plan}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">متخصص</label>

                  <p>
                    {selectedRequest.assignedSpecialist?.user?.name ||
                      selectedRequest.AssignedSpecialist?.User?.name ||
                      "—"}
                  </p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                  <label className="text-sm text-gray-500">
                    تاریخ ایجاد درخواست
                  </label>

                  <p className="font-semibold mt-1">
                    {formatApiDateToPersian(
                      selectedRequest.createdAt ?? selectedRequest.CreatedAt,
                    )}
                  </p>
                </div>

                {isDateRequired(selectedRequest.plan) && (
                  <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-700 font-medium mb-2">
                      📅 زمان نوبت انتخاب‌شده
                    </div>

                    <p className="text-lg font-bold text-blue-900">
                      {formatScheduledDateTime(
                        selectedRequest.scheduledStart ??
                          selectedRequest.ScheduledStart,
                      )}
                    </p>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="text-sm text-gray-500">شرح درخواست</label>

                  <p className="bg-gray-50 p-3 rounded mt-1">
                    {selectedRequest.description || "—"}
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="text-sm text-gray-500">کد AnyDesk</label>

                  <p className="bg-gray-50 p-3 rounded mt-1" dir="ltr">
                    {selectedRequest.anyDeskCode || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
