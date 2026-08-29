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
  dawn: "bg-yellow-100 text-yellow-800",
  morning: "bg-blue-100 text-blue-800",
  evening: "bg-orange-100 text-orange-800",
  night: "bg-purple-100 text-purple-800",
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

        // مرتب‌سازی نزولی بر اساس تاریخ و ID (جدیدترین اول)
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                📅 مدیریت شیفت‌ها
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                مدیریت و مشاهده شیفت‌های کاری متخصصان
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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

          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ▶ قبلی
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                >
                  امروز
                </button>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ◀ بعدی
                </button>
              </div>
              <h2 className="text-lg font-bold">
                {monthNames[currentPersianMonth - 1]}{" "}
                {toPersianDigits(currentPersianYear)}
              </h2>
            </div>

            <div className="grid grid-cols-7 gap-1 min-w-[600px]">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-sm font-medium text-gray-600"
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
                    className={`border rounded-lg min-h-32 p-1 ${isToday ? "bg-indigo-50 border-indigo-300" : "bg-white"}`}
                  >
                    <div
                      className={`text-sm font-medium p-1 ${isToday ? "text-indigo-700" : "text-gray-700"}`}
                    >
                      {toPersianDigits(day)}
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={`text-xs p-1 rounded flex justify-between items-center ${timeColors[shift.shiftTime]}`}
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
                            className="text-red-500 hover:text-red-700 text-xs shrink-0 ml-1 px-1"
                          >
                            ✖
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddShiftFromCalendar(persianDate)}
                        className="w-full text-xs text-gray-400 hover:text-indigo-600 py-1 mt-1"
                      >
                        + افزودن شیفت
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  حذف فیلترها
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {filteredShifts.length} شیفت یافت شد
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      شیفت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      متخصصان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{shift.id}</td>
                      <td className="px-6 py-4 text-sm">
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
                      <td className="px-6 py-4 text-sm">
                        {shift.specialists
                          ?.map((s) => getSpecialistName(s))
                          .join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(shift)}
                            className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(shift)}
                            className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(shift)}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
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
                <div key={shift.id} className="p-4 border-b">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">
                      ID: {shift.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${timeColors[shift.shiftTime]}`}
                    >
                      {timeIcons[shift.shiftTime]} {timeLabels[shift.shiftTime]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    تاریخ: {convertGregorianToPersian(shift.shiftDate)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    متخصصان:{" "}
                    {shift.specialists
                      ?.map((s) => getSpecialistName(s))
                      .join(", ") || "—"}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleView(shift)}
                      className="flex-1 text-indigo-600 py-1 text-sm"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(shift)}
                      className="flex-1 text-amber-600 py-1 text-sm"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(shift)}
                      className="flex-1 text-red-600 py-1 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredShifts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">نتیجه‌ای یافت نشد</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalType === "view" && selectedShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده شیفت</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-sm text-gray-500">ID</label>
                <p>{selectedShift.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">تاریخ</label>
                <p>{convertGregorianToPersian(selectedShift.shiftDate)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">شیفت</label>
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
                <label className="text-sm text-gray-500">متخصصان</label>
                <p>
                  {selectedShift.specialists
                    ?.map((s) => getSpecialistName(s))
                    .join(", ") || "—"}
                </p>
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

      {(modalType === "create" || modalType === "edit") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">
                {modalType === "create" ? "افزودن شیفت جدید" : "ویرایش شیفت"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  تاریخ *
                </label>
                <input
                  type="text"
                  value={displayPersianDate}
                  disabled
                  className="w-full p-2 border rounded-lg bg-gray-100 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">شیفت *</label>
                <select
                  value={formData.shiftTime}
                  onChange={(e) =>
                    setFormData({ ...formData, shiftTime: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  {shiftTimes.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.icon} {st.label} ({st.startTime} - {st.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  متخصصان
                </label>
                <div className="border rounded-lg p-2 mb-2 max-h-32 overflow-y-auto">
                  {specialists.map((spec) => (
                    <div key={spec.ID} className="flex items-center gap-2 p-1">
                      <input
                        type="checkbox"
                        id={`specialist-${spec.ID}`}
                        checked={formData.specialists.includes(
                          spec.ID.toString(),
                        )}
                        onChange={(e) => {
                          if (e.target.checked)
                            setFormData({
                              ...formData,
                              specialists: [
                                ...formData.specialists,
                                spec.ID.toString(),
                              ],
                            });
                          else
                            setFormData({
                              ...formData,
                              specialists: formData.specialists.filter(
                                (s) => s !== spec.ID.toString(),
                              ),
                            });
                        }}
                      />
                      <label htmlFor={`specialist-${spec.ID}`}>
                        {spec.user?.name} {spec.user?.lastName} (ID: {spec.ID})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={modalType === "create" ? saveNewShift : saveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                {modalType === "create" ? "افزودن" : "ذخیره"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "delete" && selectedShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600"
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
              <h3 className="text-lg font-bold text-center mb-2">حذف شیفت</h3>
              <p className="text-gray-600 text-center mb-6">
                آیا از حذف این شیفت مطمئن هستید؟
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
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
