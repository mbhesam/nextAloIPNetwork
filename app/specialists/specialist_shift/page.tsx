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
  dawn: "bg-yellow-500/20 text-yellow-200",
  morning: "bg-blue-500/20 text-blue-200",
  evening: "bg-orange-500/20 text-orange-200",
  night: "bg-purple-500/20 text-purple-200",
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

  const fetchShifts = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
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
        const specialist = await fetchCurrentSpecialist();
        if (specialist && specialist.shifts) {
          shiftsData = specialist.shifts;
        }
      }

      const myShifts = shiftsData.filter((shift) => {
        if (shift.specialists && shift.specialists.length > 0) {
          return shift.specialists.some((s) => s.ID === currentSpecialist?.ID);
        }
        return true;
      });

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
      <div className="flex items-center justify-center min-h-screen ">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col  p-4 md:p-6 relative overflow-hidden mt-30">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white/90">
            📅 شیفت‌های من
          </h1>
          <p className="text-white/50 text-sm mt-1">
            مشاهده و مدیریت شیفت‌های کاری
          </p>
          {currentSpecialist?.user && (
            <p className="text-sm text-white/40 mt-2">
              {currentSpecialist.user.name} {currentSpecialist.user.lastName}{" "}
              عزیز، خوش آمدید
            </p>
          )}
        </div>

        {/* Calendar Section */}
        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-lg hover:bg-white/20 transition border border-white/10"
              >
                ◀ قبلی
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-500/20 text-white rounded-lg hover:bg-blue-500/30 transition border border-blue-400/20"
              >
                امروز
              </button>
              <button
                onClick={nextMonth}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-lg hover:bg-white/20 transition border border-white/10"
              >
                بعدی ▶
              </button>
            </div>
            <h2 className="text-xl font-bold text-white/90">
              {monthNames[currentPersianMonth - 1]}{" "}
              {toPersianNumber(currentPersianYear)}
            </h2>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[700px]">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center py-3 text-sm font-semibold text-white/50 bg-white/5 backdrop-blur-sm rounded-lg"
                >
                  {day}
                </div>
              ))}

              {emptyDays.map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="border border-white/10 rounded-lg min-h-[120px] p-2 bg-white/5 backdrop-blur-sm"
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
                        ? "bg-blue-500/20 border-blue-400/30 ring-2 ring-blue-400/20"
                        : isSelected
                          ? "bg-green-500/20 border-green-400/30 ring-2 ring-green-400/20"
                          : "bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/10"
                    }`}
                  >
                    <div
                      className={`text-sm font-bold mb-2 ${
                        isTodayDate
                          ? "text-blue-300"
                          : isSelected
                            ? "text-green-300"
                            : "text-white/70"
                      }`}
                    >
                      {toPersianNumber(day)}
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={`text-xs p-1.5 rounded-lg ${shiftTypeColors[shift.shiftTime]} flex items-center justify-between backdrop-blur-sm`}
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
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white/90">
                  📋 جزئیات شیفت
                </h2>
                <p className="text-white/40 text-sm">
                  {selectedDate
                    ? `شیفت‌های روز ${selectedDate}`
                    : `لیست کامل شیفت‌های ثبت شده (${toPersianNumber(filteredShifts.length)} شیفت)`}
                </p>
              </div>
              {selectedDate && (
                <button
                  onClick={showAllShifts}
                  className="px-3 py-1 text-sm text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 rounded-lg transition"
                >
                  نمایش همه
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                        شناسه
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                        تاریخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                        زمان شیفت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                        متخصص
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredShifts.map((shift) => (
                      <tr
                        key={shift.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          #{shift.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70 font-medium">
                          {getSpecialistName(shift)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                <div className="divide-y divide-white/10">
                  {filteredShifts.map((shift) => (
                    <div key={shift.id} className="p-4 hover:bg-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-white/40">
                          #{shift.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${shiftTypeColors[shift.shiftTime]}`}
                        >
                          {formatShiftTime(shift.shiftTime)}
                        </span>
                      </div>
                      <div className="text-sm text-white/60 mb-1">
                        تاریخ: {formatDate(shift.shiftDate)}
                      </div>
                      <div className="text-sm font-medium text-white/80">
                        متخصص: {getSpecialistName(shift)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {filteredShifts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/50">
                    {selectedDate
                      ? "هیچ شیفتی برای این تاریخ یافت نشد"
                      : "هیچ شیفتی ثبت نشده است"}
                  </p>
                  {selectedDate && (
                    <button
                      onClick={showAllShifts}
                      className="mt-4 px-4 py-2 text-blue-300 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition"
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
