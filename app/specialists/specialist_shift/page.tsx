// app/specialist/shifts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import moment from "moment-jalaali";
import { API_BASE_URL } from "../../lib/api";

interface Shift {
  id: number;
  shiftDate: string;
  shiftTime: "dawn" | "morning" | "evening" | "night";
  specialists?: Array<{
    ID: number;
    user?: {
      name: string;
      lastName: string;
    };
  }>;
}

interface Specialist {
  ID: number;
  userID: number;
  user?: {
    ID: number;
    name: string;
    lastName: string;
  };
  shifts?: Shift[];
}



const shiftTypeLabels: { [key: string]: string } = {
  dawn: "سحر (۰-۶)",
  morning: "صبح (۶-۱۲)",
  evening: "عصر (۱۲-۱۸)",
  night: "شب (۱۸-۲۴)",
};

const shiftTypeColors: { [key: string]: string } = {
  dawn: "bg-yellow-100 text-yellow-800",
  morning: "bg-blue-100 text-blue-800",
  evening: "bg-orange-100 text-orange-800",
  night: "bg-purple-100 text-purple-800",
};

const shiftTypeIcons: { [key: string]: string } = {
  dawn: "🌅",
  morning: "☀️",
  evening: "🌙",
  night: "⭐",
};

const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const weekDays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

export default function SpecialistShiftsPage() {
  const { getAccessToken, user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentSpecialist, setCurrentSpecialist] = useState<Specialist | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [currentPersianYear, setCurrentPersianYear] = useState(1405);
  const [currentPersianMonth, setCurrentPersianMonth] = useState(3);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);

  // دریافت اطلاعات متخصص فعلی
  const fetchCurrentSpecialist = async () => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/specialists?limit=100&offset=0`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const specialistsArray = Array.isArray(data)
          ? data
          : data.data || data.specialists || [];

        const currentSpecialist = specialistsArray.find(
          (spec: Specialist) => spec.userID === user?.ID,
        );

        if (currentSpecialist) {
          setCurrentSpecialist(currentSpecialist);
          return currentSpecialist;
        }
      }
    } catch (error) {
      console.error("Error fetching specialist info:", error);
    }
    return null;
  };

  // دریافت شیفت‌ها از API
  const fetchShifts = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      // ابتدا تلاش برای دریافت شیفت‌ها از endpoint مخصوص
      let response = await fetch(`${API_BASE_URL}/v1/specialists/shifts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let shiftsData: Shift[] = [];

      if (response.ok) {
        const data = await response.json();
        shiftsData = Array.isArray(data)
          ? data
          : data.data || data.shifts || [];
      } else {
        // اگر endpoint شیفت جداگانه نداشت، از اطلاعات متخصص استفاده می‌کنیم
        const specialist = await fetchCurrentSpecialist();
        if (specialist && specialist.shifts) {
          shiftsData = specialist.shifts;
        }
      }

      // فیلتر کردن شیفت‌های مربوط به متخصص فعلی
      const myShifts = shiftsData.filter((shift) => {
        if (shift.specialists && shift.specialists.length > 0) {
          return shift.specialists.some((s) => s.ID === currentSpecialist?.ID);
        }
        return true; // اگر اطلاعات متخصص در شیفت نبود، همه را نشان بده
      });

      // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
      const sorted = [...myShifts].sort(
        (a, b) =>
          new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime(),
      );

      setShifts(sorted);
      setFilteredShifts(sorted);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCurrentSpecialist();
      await fetchShifts();

      // تنظیم تاریخ فعلی به امروز
      const today = moment();
      setCurrentPersianYear(parseInt(today.format("jYYYY")));
      setCurrentPersianMonth(parseInt(today.format("jMM")));
    };

    loadData();
  }, [user]);

  const toPersianNumber = (num: number): string => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num
      .toString()
      .split("")
      .map((d) => persianDigits[parseInt(d)])
      .join("");
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "—";
    return moment(dateString).format("jYYYY/jMM/jDD");
  };

  const formatShiftTime = (shiftTime: string): string => {
    return shiftTypeLabels[shiftTime] || shiftTime;
  };

  const getSpecialistName = (shift: Shift): string => {
    if (currentSpecialist?.user) {
      return `${currentSpecialist.user.name} ${currentSpecialist.user.lastName}`;
    }
    if (shift.specialists && shift.specialists.length > 0) {
      const specialist = shift.specialists[0];
      if (specialist.user) {
        return `${specialist.user.name} ${specialist.user.lastName}`;
      }
    }
    return "من";
  };

  const getShiftsForDate = (
    year: number,
    month: number,
    day: number,
  ): Shift[] => {
    const targetDate = moment(
      `${year}/${month}/${day}`,
      "jYYYY/jMM/jDD",
    ).format("YYYY-MM-DD");
    return shifts.filter((shift) => {
      const shiftDate = moment(shift.shiftDate).format("YYYY-MM-DD");
      return shiftDate === targetDate;
    });
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    const dateStr = `${toPersianNumber(year)}/${toPersianNumber(month)}/${toPersianNumber(day)}`;
    setSelectedDate(dateStr);
    const filtered = getShiftsForDate(year, month, day);
    setFilteredShifts(filtered);
  };

  const showAllShifts = () => {
    setSelectedDate(null);
    setFilteredShifts(shifts);
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchShifts();
    setLoading(false);
  };

  const isToday = (year: number, month: number, day: number): boolean => {
    const today = moment();
    return (
      today.format("jYYYY") === String(year) &&
      today.format("jMM") === String(month).padStart(2, "0") &&
      today.format("jDD") === String(day).padStart(2, "0")
    );
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return moment(`${year}/${month}/01`, "jYYYY/jMM/DD").daysInMonth();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    const firstDay = moment(`${year}/${month}/01`, "jYYYY/jMM/DD");
    let dayOfWeek = firstDay.day();
    // در moment با locale ایران، 0=شنبه است
    return dayOfWeek;
  };

  const prevMonth = () => {
    let newYear = currentPersianYear;
    let newMonth = currentPersianMonth - 1;

    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentPersianYear(newYear);
    setCurrentPersianMonth(newMonth);
  };

  const nextMonth = () => {
    let newYear = currentPersianYear;
    let newMonth = currentPersianMonth + 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    setCurrentPersianYear(newYear);
    setCurrentPersianMonth(newMonth);
  };

  const goToToday = () => {
    const today = moment();
    setCurrentPersianYear(parseInt(today.format("jYYYY")));
    setCurrentPersianMonth(parseInt(today.format("jMM")));
  };

  const daysInMonth = getDaysInMonth(currentPersianYear, currentPersianMonth);
  const firstDayOfMonth = getFirstDayOfMonth(
    currentPersianYear,
    currentPersianMonth,
  );
  const emptyDays = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 mt-30">
        {/* Header */}
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📅 شیفت‌های من
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            مشاهده و مدیریت شیفت‌های کاری
          </p>
          {currentSpecialist?.user && (
            <p className="text-sm text-gray-500 mt-2">
              {currentSpecialist.user.name} {currentSpecialist.user.lastName}{" "}
              عزیز، خوش آمدید
            </p>
          )}
        </div>

        {/* Calendar Section */}
        <div className="flex-shrink-0 bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ◀ قبلی
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                امروز
              </button>
              <button
                onClick={nextMonth}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                بعدی ▶
              </button>
            </div>
            <h2 className="text-xl font-bold">
              {monthNames[currentPersianMonth - 1]}{" "}
              {toPersianNumber(currentPersianYear)}
            </h2>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              🔄 به‌روزرسانی
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[700px]">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center py-3 text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg"
                >
                  {day}
                </div>
              ))}

              {emptyDays.map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="border rounded-lg min-h-[120px] p-2 bg-gray-50"
                ></div>
              ))}

              {days.map((day) => {
                const dayShifts = getShiftsForDate(
                  currentPersianYear,
                  currentPersianMonth,
                  day,
                );
                const isTodayDate = isToday(
                  currentPersianYear,
                  currentPersianMonth,
                  day,
                );
                const dateStr = `${toPersianNumber(currentPersianYear)}/${toPersianNumber(currentPersianMonth)}/${toPersianNumber(day)}`;
                const isSelected = selectedDate === dateStr;

                return (
                  <div
                    key={day}
                    onClick={() =>
                      handleDateClick(
                        currentPersianYear,
                        currentPersianMonth,
                        day,
                      )
                    }
                    className={`border rounded-lg min-h-[120px] p-2 transition-all cursor-pointer hover:shadow-md ${
                      isTodayDate
                        ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                        : isSelected
                          ? "bg-green-50 border-green-300 ring-2 ring-green-200"
                          : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`text-sm font-bold mb-2 ${
                        isTodayDate
                          ? "text-indigo-700"
                          : isSelected
                            ? "text-green-700"
                            : "text-gray-700"
                      }`}
                    >
                      {toPersianNumber(day)}
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={`text-xs p-1.5 rounded-lg ${shiftTypeColors[shift.shiftTime]} flex items-center justify-between`}
                        >
                          <span className="truncate">
                            {shiftTypeIcons[shift.shiftTime]}{" "}
                            {formatShiftTime(shift.shiftTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shifts Details Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  📋 جزئیات شیفت
                </h2>
                <p className="text-gray-500 text-sm">
                  {selectedDate
                    ? `شیفت‌های روز ${selectedDate}`
                    : `لیست کامل شیفت‌های ثبت شده (${toPersianNumber(filteredShifts.length)} شیفت)`}
                </p>
              </div>
              {selectedDate && (
                <button
                  onClick={showAllShifts}
                  className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  نمایش همه
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        شناسه
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاریخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        زمان شیفت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        متخصص
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredShifts.map((shift) => (
                      <tr
                        key={shift.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{shift.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(shift.shiftDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${shiftTypeColors[shift.shiftTime]}`}
                          >
                            {shiftTypeIcons[shift.shiftTime]}{" "}
                            {formatShiftTime(shift.shiftTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {getSpecialistName(shift)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                <div className="divide-y divide-gray-200">
                  {filteredShifts.map((shift) => (
                    <div key={shift.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500">
                          #{shift.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${shiftTypeColors[shift.shiftTime]}`}
                        >
                          {formatShiftTime(shift.shiftTime)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        تاریخ: {formatDate(shift.shiftDate)}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        متخصص: {getSpecialistName(shift)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {filteredShifts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {selectedDate
                      ? "هیچ شیفتی برای این تاریخ یافت نشد"
                      : "هیچ شیفتی ثبت نشده است"}
                  </p>
                  {selectedDate && (
                    <button
                      onClick={showAllShifts}
                      className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                    >
                      نمایش همه شیفت‌ها
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
