// app/specialists/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

interface Category {
  id: number;
  name: string;
  subCategory: string[];
}

interface Specialist {
  ID: number;
  UserID: number;
  skills: string;
  Categories: Category[];
  User?: {
    id?: number;
    Name?: string;
    LastName?: string;
    Email?: string;
    PhoneNumber?: string;
    // برای پشتیبانی از حالت‌های مختلف
    name?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
}



const skillColors: { [key: string]: string } = {
  juniper: "bg-cyan-100 text-cyan-800",
  voip: "bg-orange-100 text-orange-800",
  mpls: "bg-emerald-100 text-emerald-800",
  "network admin": "bg-slate-100 text-slate-800",
  cabling: "bg-amber-100 text-amber-800",
  sophos: "bg-lime-100 text-lime-800",
  ccna: "bg-sky-100 text-sky-800",
  ccnp: "bg-violet-100 text-violet-800",
  default: "bg-gray-100 text-gray-700",
};

const categoryColors: { [key: string]: string } = {
  firewall: "bg-red-100 text-red-800",
  "routing&switching": "bg-blue-100 text-blue-800",
  Sambal: "bg-purple-100 text-purple-800",
  security: "bg-green-100 text-green-800",
  cloud: "bg-cyan-100 text-cyan-800",
  default: "bg-gray-100 text-gray-700",
};

export default function SpecialistsPage() {
  const { getAccessToken } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialist, setSelectedSpecialist] =
    useState<Specialist | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // دریافت لیست متخصصان از API
  const fetchSpecialists = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/specialists?limit=100&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);

        const specialistsArray = Array.isArray(data)
          ? data
          : data.data || data.specialists || [];
        setSpecialists(specialistsArray);
      } else {
        console.error("Failed to fetch specialists:", response.status);
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  // تابع دریافت نام کامل - پشتیبانی از هر دو حالت حروف بزرگ و کوچک
  const getFullName = (specialist: Specialist): string => {
    if (specialist.User) {
      // اولویت با حروف بزرگ (API شما)
      const name = specialist.User.Name || specialist.User.name;
      const lastName = specialist.User.LastName || specialist.User.lastName;

      if (name) {
        return `${name} ${lastName || ""}`.trim();
      }
    }

    // اگر اطلاعات کاربر وجود نداشت، از ID استفاده کن
    return `متخصص ${specialist.ID}`;
  };

  // تابع دریافت شماره تماس
  const getPhoneNumber = (specialist: Specialist): string => {
    if (specialist.User) {
      const phone = specialist.User.PhoneNumber || specialist.User.phoneNumber;
      if (phone && phone !== "null" && phone !== "undefined") {
        return phone;
      }
    }
    return "شماره تماس ثبت نشده";
  };

  // تابع دریافت ایمیل
  const getEmail = (specialist: Specialist): string => {
    if (specialist.User) {
      const email = specialist.User.Email || specialist.User.email;
      if (email && email !== "null" && email !== "undefined") {
        return email;
      }
    }
    return "ایمیل ثبت نشده";
  };

  const getSkillsArray = (skills: string): string[] => {
    if (!skills) return [];
    return skills.split(",").map((skill) => skill.trim());
  };

  const getCategoriesArray = (categories: Category[] | undefined): string[] => {
    if (!categories || !Array.isArray(categories)) return [];
    return categories.map((cat) => cat.name);
  };

  const getSkillColor = (skill: string): string => {
    return skillColors[skill.toLowerCase()] || skillColors.default;
  };

  const getCategoryColor = (category: string): string => {
    return categoryColors[category.toLowerCase()] || categoryColors.default;
  };

  const handleViewProfile = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setShowProfileModal(true);
  };

  const closeModal = () => {
    setShowProfileModal(false);
    setSelectedSpecialist(null);
  };

  const filteredSpecialists = specialists.filter((specialist) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const fullName = getFullName(specialist).toLowerCase();
    const skills = getSkillsArray(specialist.skills);
    const categories = getCategoriesArray(specialist.Categories);
    const phone = getPhoneNumber(specialist);

    return (
      fullName.includes(searchLower) ||
      skills.some((skill) => skill.toLowerCase().includes(searchLower)) ||
      categories.some((cat) => cat.toLowerCase().includes(searchLower)) ||
      phone.includes(searchTerm)
    );
  });

  const refreshData = async () => {
    setLoading(true);
    await fetchSpecialists();
    setLoading(false);
  };

  const toPersianNumber = (num: number): string => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num
      .toString()
      .split("")
      .map((d) => persianDigits[parseInt(d)])
      .join("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 mt-30">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              👨‍🔧 لیست متخصصان
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              مشاهده و جستجوی متخصصان بر اساس مهارت و دسته‌بندی
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {toPersianNumber(specialists.length)} متخصص در سیستم
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
          >
            🔄 به‌روزرسانی
          </button>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، مهارت، دسته‌بندی یا شماره تماس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {toPersianNumber(filteredSpecialists.length)} متخصص یافت شد
          </p>
        </div>

        {/* Specialists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialists.map((specialist) => {
            const skills = getSkillsArray(specialist.skills);
            const categories = getCategoriesArray(specialist.Categories);
            const fullName = getFullName(specialist);
            const phone = getPhoneNumber(specialist);
            const email = getEmail(specialist);

            return (
              <div
                key={specialist.ID}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                      👨‍🔧
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {fullName}
                      </h3>
                      <p className="text-indigo-100 text-xs">
                        متخصص فناوری اطلاعات
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Skills */}
                  {skills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔧</span>
                        <span className="text-sm font-semibold text-gray-700">
                          مهارت‌ها:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getSkillColor(skill)}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📂</span>
                        <span className="text-sm font-semibold text-gray-700">
                          دسته‌بندی‌ها:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(category)}`}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span>📞</span>
                      <span className="font-mono text-gray-700" dir="ltr">
                        {phone}
                      </span>
                    </div>
                    {email !== "ایمیل ثبت نشده" && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <span>✉️</span>
                        <span className="truncate" dir="ltr">
                          {email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-5 py-3">
                  <button
                    onClick={() => handleViewProfile(specialist)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    مشاهده پروفایل
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredSpecialists.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              {searchTerm
                ? "هیچ متخصصی با این معیارها یافت نشد"
                : "هیچ متخصصی ثبت نشده است"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                پاک کردن جستجو
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedSpecialist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">پروفایل متخصص</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 text-2xl hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Header Info */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl">
                  👨‍🔧
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {getFullName(selectedSpecialist)}
                  </h3>
                  <p className="text-gray-600">متخصص فناوری اطلاعات</p>
                  <p className="text-xs text-gray-400 mt-1">
                    کد متخصص: {selectedSpecialist.ID}
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📞</span> اطلاعات تماس
                </h4>
                <div className="space-y-2 pr-4">
                  <p className="text-gray-700">
                    <span className="font-medium">شماره تماس:</span>{" "}
                    <span dir="ltr" className="font-mono">
                      {getPhoneNumber(selectedSpecialist)}
                    </span>
                  </p>
                  {getEmail(selectedSpecialist) !== "ایمیل ثبت نشده" && (
                    <p className="text-gray-700">
                      <span className="font-medium">ایمیل:</span>{" "}
                      <span dir="ltr">{getEmail(selectedSpecialist)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {getSkillsArray(selectedSpecialist.skills).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🔧</span> مهارت‌ها
                  </h4>
                  <div className="flex flex-wrap gap-2 pr-4">
                    {getSkillsArray(selectedSpecialist.skills).map(
                      (skill, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 text-sm rounded-full ${getSkillColor(skill)}`}
                        >
                          {skill}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Categories */}
              {getCategoriesArray(selectedSpecialist.Categories).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📂</span> دسته‌بندی‌های تخصصی
                  </h4>
                  <div className="flex flex-wrap gap-2 pr-4">
                    {getCategoriesArray(selectedSpecialist.Categories).map(
                      (category, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(category)}`}
                        >
                          {category}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
              >
                بستن
              </button>
              {getPhoneNumber(selectedSpecialist) !== "شماره تماس ثبت نشده" && (
                <button
                  onClick={() => {
                    window.location.href = `tel:${getPhoneNumber(selectedSpecialist)}`;
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  📞 تماس با متخصص
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
