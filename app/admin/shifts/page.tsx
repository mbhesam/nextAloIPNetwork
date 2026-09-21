"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import moment from "moment-jalaali";
import { API_BASE_URL } from "../../lib/api";

interface Shift {
  id: number;
  shiftDate: string;
  shiftTime: string;
  specialists: any[];
}

interface Specialist {
  ID: number;
  userID: number;
  user?: {
    ID: number;
    name: string;
    lastName: string;
  };
}

moment.loadPersian({ dialect: "persian-modern" });

const timeLabels: { [key: string]: string } = {
  dawn: "سحر",
  morning: "صبح",
  evening: "عصر",
  night: "شب",
};

const timeColors: { [key: string]: string } = {
  dawn: "bg-yellow-500/20 text-yellow-200",
  morning: "bg-blue-500/20 text-blue-200",
  evening: "bg-orange-500/20 text-orange-200",
  night: "bg-purple-500/20 text-purple-200",
};

const timeIcons: { [key: string]: string } = {
  dawn: "🌅",
  morning: "☀️",
  evening: "🌙",
  night: "⭐",
};

const shiftTimes = [
  {
    id: 1,
    name: "dawn",
    label: "سحر",
    startTime: "00:00",
    endTime: "06:00",
    icon: "🌅",
  },
  {
    id: 2,
    name: "morning",
    label: "صبح",
    startTime: "06:00",
    endTime: "12:00",
    icon: "☀️",
  },
  {
    id: 3,
    name: "evening",
    label: "عصر",
    startTime: "12:00",
    endTime: "18:00",
    icon: "🌙",
  },
  {
    id: 4,
    name: "night",
    label: "شب",
    startTime: "18:00",
    endTime: "24:00",
    icon: "⭐",
  },
];

type ModalType = "view" | "edit" | "delete" | "create" | null;

const toPersianDigits = (num: number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .split("")
    .map((d) => persianDigits[parseInt(d)])
    .join("");
};

const convertGregorianToPersian = (gregorianDate: string): string => {
  if (!gregorianDate) return "";
  try {
    return moment(gregorianDate).format("jYYYY/jMM/jDD");
  } catch (error) {
    return gregorianDate;
  }
};

const convertPersianToGregorian = (persianDate: string): string => {
  if (!persianDate) return "";
  try {
    const [year, month, day] = persianDate.split("/").map(Number);
    return moment(`${year}/${month}/${day}`, "jYYYY/jMM/jDD").format(
      "YYYY-MM-DD",
    );
  } catch (error) {
    return "";
  }
};

export default function AdminShiftsPage() {
  const { getAccessToken } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const today = new Date();
  const persianToday = convertGregorianToPersian(
    today.toISOString().split("T")[0],
  );
  const [currentPersianYear, setCurrentPersianYear] = useState(
    parseInt(persianToday.split("/")[0]),
  );
  const [currentPersianMonth, setCurrentPersianMonth] = useState(
    parseInt(persianToday.split("/")[1]),
  );

  const [formData, setFormData] = useState({
    shiftDate: "",
    shiftTime: "morning",
    specialists: [] as string[],
  });

  const [displayPersianDate, setDisplayPersianDate] = useState("");

  const fetchSpecialists = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/specialists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSpecialists(
          Array.isArray(data) ? data : data.data || data.specialists || [],
        );
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    }
  };

  const fetchShifts = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/shifts/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 100, offset: 0 }),
      });

      if (response.ok) {
        const data = await response.json();
        const shiftsArray = Array.isArray(data)
          ? data
          : data.data || data.shifts || [];

        const convertedShifts = shiftsArray.map((shift: any) => ({
          id: shift.ID,
          shiftDate: shift.ShiftDate?.split("T")[0],
          shiftTime: shift.ShiftTime,
          specialists: shift.Specialists || [],
        }));

        const sortedShifts = [...convertedShifts].sort((a, b) => {
          if (a.shiftDate > b.shiftDate) return -1;
          if (a.shiftDate < b.shiftDate) return 1;
          return b.id - a.id;
        });

        setShifts(sortedShifts);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const createShift = async (shiftData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    const requestBody = {
      shiftDate: shiftData.shiftDate,
      shiftTime: shiftData.shiftTime,
      specialistIds: shiftData.specialists.map((s: string) => parseInt(s)),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/v1/shift`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.status === 201 && data.ID && data.ID > 0) {
        await fetchShifts();
        return true;
      } else {
        alert("❌ خطا: شیفت ثبت نشد. لطفاً دوباره تلاش کنید.");
        return false;
      }
    } catch (error) {
      console.error("Error creating shift:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const updateShift = async (id: number, shiftData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/shift/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shiftDate: shiftData.shiftDate,
          shiftTime: shiftData.shiftTime,
          specialistIds: shiftData.specialists.map((s: string) => parseInt(s)),
        }),
      });

      if (response.ok) {
        await fetchShifts();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating shift:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const deleteShift = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/shift/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchShifts();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchSpecialists();
  }, []);

  const getSpecialistName = (specialist: any) => {
    if (specialist?.user) {
      return `${specialist.user.name} ${specialist.user.lastName}`;
    }
    return `متخصص ${specialist?.ID || specialist?.id || specialist?.userID || ""}`;
  };

  const getShiftsForDate = (year: number, month: number, day: number) => {
    const persianDate = `${year}/${month}/${day}`;
    const gregorianDate = convertPersianToGregorian(persianDate);
    return shifts.filter((shift) => shift.shiftDate === gregorianDate);
  };

  const getPersianDaysInMonth = (year: number, month: number): number[] => {
    const lastDay = moment(`${year}/${month}/1`, "jYYYY/jMM/jDD")
      .endOf("jMonth")
      .format("jD");
    return Array.from({ length: parseInt(lastDay) }, (_, i) => i + 1);
  };

  const daysInMonth = getPersianDaysInMonth(
    currentPersianYear,
    currentPersianMonth,
  );
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
    "پنجشنبه",
    "جمعه",
  ];

  const prevMonth = () => {
    if (currentPersianMonth === 1) {
      setCurrentPersianMonth(12);
      setCurrentPersianYear(currentPersianYear - 1);
    } else {
      setCurrentPersianMonth(currentPersianMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentPersianMonth === 12) {
      setCurrentPersianMonth(1);
      setCurrentPersianYear(currentPersianYear + 1);
    } else {
      setCurrentPersianMonth(currentPersianMonth + 1);
    }
  };

  const goToToday = () => {
    const todayDate = new Date();
    const persian = convertGregorianToPersian(
      todayDate.toISOString().split("T")[0],
    );
    const [year, month] = persian.split("/").map(Number);
    setCurrentPersianYear(year);
    setCurrentPersianMonth(month);
  };

  const handleAddShiftFromCalendar = (persianDate: string) => {
    const [year, month, day] = persianDate.split("/").map(Number);
    const gregorianDate = moment(
      `${year}/${month}/${day}`,
      "jYYYY/jMM/jDD",
    ).format("YYYY-MM-DD");
    const persianDateFormatted = persianDate
      .split("/")
      .map((p) => toPersianDigits(parseInt(p)))
      .join("/");
    setDisplayPersianDate(persianDateFormatted);
    setFormData({
      shiftDate: gregorianDate,
      shiftTime: "morning",
      specialists: [],
    });
    setModalType("create");
  };

  const filteredShifts = [...shifts]
    .filter((shift) => {
      const searchLower = searchTerm.toLowerCase();
      const specialistNames =
        shift.specialists?.map((s) => getSpecialistName(s)).join(" ") || "";
      const persianDate = convertGregorianToPersian(shift.shiftDate);
      return (
        (shift.id?.toString() || "").includes(searchTerm) ||
        persianDate.includes(searchTerm) ||
        (shift.shiftTime || "").toLowerCase().includes(searchLower) ||
        specialistNames.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => b.id - a.id);

  const handleView = (shift: Shift) => {
    setSelectedShift(shift);
    setModalType("view");
  };

  const handleEdit = (shift: Shift) => {
    setSelectedShift(shift);
    const persianDate = convertGregorianToPersian(shift.shiftDate);
    setDisplayPersianDate(
      persianDate
        .split("/")
        .map((p) => toPersianDigits(parseInt(p)))
        .join("/"),
    );
    setFormData({
      shiftDate: shift.shiftDate,
      shiftTime: shift.shiftTime,
      specialists:
        shift.specialists
          ?.map((s) => (s.ID || s.id || s.userID)?.toString())
          .filter(Boolean) || [],
    });
    setModalType("edit");
  };

  const handleDeleteClick = (shift: Shift) => {
    setSelectedShift(shift);
    setModalType("delete");
  };

  const handleCreate = () => {
    const todayGregorian = new Date().toISOString().split("T")[0];
    const todayPersian = convertGregorianToPersian(todayGregorian);
    setDisplayPersianDate(
      todayPersian
        .split("/")
        .map((p) => toPersianDigits(parseInt(p)))
        .join("/"),
    );
    setFormData({
      shiftDate: todayGregorian,
      shiftTime: "morning",
      specialists: [],
    });
    setModalType("create");
  };

  const confirmDelete = async () => {
    if (selectedShift) {
      await deleteShift(selectedShift.id);
      closeModal();
    }
  };

  const saveEdit = async () => {
    if (selectedShift && formData.shiftDate && formData.shiftTime) {
      const success = await updateShift(selectedShift.id, {
        shiftDate: formData.shiftDate,
        shiftTime: formData.shiftTime,
        specialists: formData.specialists,
      });
      if (success) {
        closeModal();
      }
    } else {
      alert("لطفاً تمام فیلدها را پر کنید");
    }
  };

  const saveNewShift = async () => {
    if (!formData.shiftDate || !formData.shiftTime) {
      alert("لطفاً تاریخ و شیفت را وارد کنید");
      return;
    }

    const success = await createShift({
      shiftDate: formData.shiftDate,
      shiftTime: formData.shiftTime,
      specialists: formData.specialists,
    });

    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedShift(null);
    setDisplayPersianDate("");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
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

      <div className="relative z-10 flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                📅 مدیریت شیفت‌ها
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت و مشاهده شیفت‌های کاری متخصصان
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              شیفت جدید
            </button>
          </div>

          {/* تقویم */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex-shrink-0 overflow-x-auto">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/80 rounded-lg hover:bg-white/20 transition border border-white/10"
                >
                  ▶ قبلی
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 bg-blue-500/20 text-white rounded-lg  transition border border-blue-400/20"
                >
                  امروز
                </button>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/80 rounded-lg hover:bg-white/20 transition border border-white/10"
                >
                  ◀ بعدی
                </button>
              </div>
              <h2 className="text-lg font-bold text-white/90">
                {monthNames[currentPersianMonth - 1]}{" "}
                {toPersianDigits(currentPersianYear)}
              </h2>
            </div>

            <div className="grid grid-cols-7 gap-1 min-w-[600px]">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-sm font-medium text-white/50"
                >
                  {day}
                </div>
              ))}
              {daysInMonth.map((day) => {
                const persianDate = `${currentPersianYear}/${currentPersianMonth}/${day}`;
                const dayShifts = getShiftsForDate(
                  currentPersianYear,
                  currentPersianMonth,
                  day,
                );
                const isToday = (() => {
                  const todayDate = new Date();
                  const persianTodayDate = convertGregorianToPersian(
                    todayDate.toISOString().split("T")[0],
                  );
                  const [ty, tm, td] = persianTodayDate.split("/").map(Number);
                  return (
                    ty === currentPersianYear &&
                    tm === currentPersianMonth &&
                    td === day
                  );
                })();

                return (
                  <div
                    key={day}
                    className={`border rounded-lg min-h-32 p-1 ${isToday ? "bg-blue-500/20 border-blue-400/30" : "bg-white/5 border-white/10"}`}
                  >
                    <div
                      className={`text-sm font-medium p-1 ${isToday ? "text-blue-300" : "text-white/70"}`}
                    >
                      {toPersianDigits(day)}
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={`text-xs p-1 rounded flex justify-between items-center ${timeColors[shift.shiftTime]} backdrop-blur-sm`}
                        >
                          <span
                            className="truncate cursor-pointer flex-1"
                            onClick={() => handleView(shift)}
                          >
                            <span className="ml-1">
                              {timeIcons[shift.shiftTime]}
                            </span>
                            {timeLabels[shift.shiftTime]} |{" "}
                            {shift.specialists?.length || 0} متخصص
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("آیا از حذف این شیفت مطمئن هستید؟"))
                                deleteShift(shift.id);
                            }}
                            className="text-red-400 hover:text-red-300 text-xs shrink-0 ml-1 px-1 transition"
                          >
                            ✖
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddShiftFromCalendar(persianDate)}
                        className="w-full text-xs text-white/30 hover:text-blue-300 py-1 mt-1 transition"
                      >
                        + افزودن شیفت
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* جستجو */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-white/70 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition border border-white/10"
                >
                  حذف فیلترها
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-white/40">
              {filteredShifts.length} شیفت یافت شد
            </div>
          </div>

          {/* جدول */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      شیفت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      متخصصان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm text-white/80">
                        {shift.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {convertGregorianToPersian(shift.shiftDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${timeColors[shift.shiftTime]}`}
                        >
                          {timeIcons[shift.shiftTime]}{" "}
                          {timeLabels[shift.shiftTime]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {shift.specialists
                          ?.map((s) => getSpecialistName(s))
                          .join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(shift)}
                            className="text-blue-300 hover:text-blue-200 px-2 py-1 rounded  transition"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(shift)}
                            className="text-amber-300 hover:text-amber-200 px-2 py-1 rounded  transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(shift)}
                            className="text-red-300 hover:text-red-200 px-2 py-1 rounded  transition"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {filteredShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white/40">
                      ID: {shift.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${timeColors[shift.shiftTime]}`}
                    >
                      {timeIcons[shift.shiftTime]} {timeLabels[shift.shiftTime]}
                    </span>
                  </div>
                  <div className="text-sm text-white/60 mb-1">
                    تاریخ: {convertGregorianToPersian(shift.shiftDate)}
                  </div>
                  <div className="text-sm text-white/60 mb-3">
                    متخصصان:{" "}
                    {shift.specialists
                      ?.map((s) => getSpecialistName(s))
                      .join(", ") || "—"}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(shift)}
                      className="flex-1 text-blue-300 py-1 text-sm  rounded transition"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(shift)}
                      className="flex-1 text-amber-300 py-1 text-sm  rounded transition"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(shift)}
                      className="flex-1 text-red-300 py-1 text-sm rounded transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredShifts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">نتیجه‌ای یافت نشد</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {modalType === "view" && selectedShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">مشاهده شیفت</h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-sm text-white/50">ID</label>
                <p className="text-white/80">{selectedShift.id}</p>
              </div>
              <div>
                <label className="text-sm text-white/50">تاریخ</label>
                <p className="text-white/80">
                  {convertGregorianToPersian(selectedShift.shiftDate)}
                </p>
              </div>
              <div>
                <label className="text-sm text-white/50">شیفت</label>
                <p>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${timeColors[selectedShift.shiftTime]}`}
                  >
                    {timeIcons[selectedShift.shiftTime]}{" "}
                    {timeLabels[selectedShift.shiftTime]}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-white/50">متخصصان</label>
                <p className="text-white/80">
                  {selectedShift.specialists
                    ?.map((s) => getSpecialistName(s))
                    .join(", ") || "—"}
                </p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modalType === "create" || modalType === "edit") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                {modalType === "create" ? "افزودن شیفت جدید" : "ویرایش شیفت"}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  تاریخ *
                </label>
                <input
                  type="text"
                  value={displayPersianDate}
                  disabled
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white cursor-not-allowed text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  شیفت *
                </label>
                <select
                  value={formData.shiftTime}
                  onChange={(e) =>
                    setFormData({ ...formData, shiftTime: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    outline: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {shiftTimes.map((st) => (
                    <option
                      key={st.id}
                      value={st.name}
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      {st.icon} {st.label} ({st.startTime} - {st.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  متخصصان
                </label>
                <div className="border border-white/20 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto bg-white/5 backdrop-blur-sm">
                  {specialists.map((spec) => (
                    <div
                      key={spec.ID}
                      className="flex items-center gap-2 p-1 hover:bg-white/5 rounded"
                    >
                      <input
                        type="checkbox"
                        id={`specialist-${spec.ID}`}
                        checked={formData.specialists.includes(
                          spec.ID.toString(),
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              specialists: [
                                ...formData.specialists,
                                spec.ID.toString(),
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              specialists: formData.specialists.filter(
                                (s) => s !== spec.ID.toString(),
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
                      />
                      <label
                        htmlFor={`specialist-${spec.ID}`}
                        className="text-white/80 text-sm"
                      >
                        {spec.user?.name} {spec.user?.lastName} (ID: {spec.ID})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                انصراف
              </button>
              <button
                onClick={modalType === "create" ? saveNewShift : saveEdit}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
              >
                {modalType === "create" ? "افزودن" : "ذخیره"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/30">
                  <svg
                    className="w-8 h-8 text-red-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white/90 text-center mb-2">
                حذف شیفت
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف این شیفت مطمئن هستید؟
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 text-red-200 border border-red-400/30 rounded-lg transition"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
