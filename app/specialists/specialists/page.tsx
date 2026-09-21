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
    name?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
}

const skillColors: { [key: string]: string } = {
  juniper: "bg-cyan-500/20 text-cyan-200",
  voip: "bg-orange-500/20 text-orange-200",
  mpls: "bg-emerald-500/20 text-emerald-200",
  "network admin": "bg-slate-500/20 text-slate-200",
  cabling: "bg-amber-500/20 text-amber-200",
  sophos: "bg-lime-500/20 text-lime-200",
  ccna: "bg-sky-500/20 text-sky-200",
  ccnp: "bg-violet-500/20 text-violet-200",
  default: "bg-white/10 text-white/60",
};

const categoryColors: { [key: string]: string } = {
  firewall: "bg-red-500/20 text-red-200",
  "routing&switching": "bg-blue-500/20 text-blue-200",
  Sambal: "bg-purple-500/20 text-purple-200",
  security: "bg-green-500/20 text-green-200",
  cloud: "bg-cyan-500/20 text-cyan-200",
  default: "bg-white/10 text-white/60",
};

export default function SpecialistsPage() {
  const { getAccessToken } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialist, setSelectedSpecialist] =
    useState<Specialist | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const getFullName = (specialist: Specialist): string => {
    if (specialist.User) {
      const name = specialist.User.Name || specialist.User.name;
      const lastName = specialist.User.LastName || specialist.User.lastName;
      if (name) {
        return `${name} ${lastName || ""}`.trim();
      }
    }
    return `متخصص ${specialist.ID}`;
  };

  const getPhoneNumber = (specialist: Specialist): string => {
    if (specialist.User) {
      const phone = specialist.User.PhoneNumber || specialist.User.phoneNumber;
      if (phone && phone !== "null" && phone !== "undefined") {
        return phone;
      }
    }
    return "شماره تماس ثبت نشده";
  };

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-6 relative overflow-hidden mt-30">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex ">
            <h1 className=" flex text-2xl sm:text-3xl font-bold text-white/90">
              👨‍🔧 لیست متخصصان
            </h1>
            <p className=" text-xs text-white/30  mr-5 border p-2 rounded-2xl bg-green-600">
              {toPersianNumber(specialists.length)} متخصص در سیستم
            </p>
          </div>
      
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، مهارت، دسته‌بندی یا شماره تماس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40"
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
          <p className="text-sm text-white/40 mt-2">
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
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden hover:shadow-xl hover:bg-white/15 transition-all duration-300 flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                      👨‍🔧
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {fullName}
                      </h3>
                      <p className="text-indigo-200 text-xs">
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
                        <span className="text-sm font-semibold text-white/70">
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
                        <span className="text-sm font-semibold text-white/70">
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
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span>📞</span>
                      <span className="font-mono" dir="ltr">
                        {phone}
                      </span>
                    </div>
                    {email !== "ایمیل ثبت نشده" && (
                      <div className="flex items-center gap-2 text-sm text-white/50 mt-2">
                        <span>✉️</span>
                        <span className="truncate" dir="ltr">
                          {email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-white/5 backdrop-blur-sm px-5 py-3 border-t border-white/10">
                  <button
                    onClick={() => handleViewProfile(specialist)}
                    className="w-full bg-blue-500/30 hover:bg-blue-500/40 text-white py-2 rounded-lg text-sm font-medium transition-colors border border-blue-400/20"
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
          <div className="text-center py-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-white/50 text-lg">
              {searchTerm
                ? "هیچ متخصصی با این معیارها یافت نشد"
                : "هیچ متخصصی ثبت نشده است"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 text-blue-300 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white/90">پروفایل متخصص</h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Header Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500/80 to-purple-600/80 rounded-full flex items-center justify-center text-4xl">
                  👨‍🔧
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white/90">
                    {getFullName(selectedSpecialist)}
                  </h3>
                  <p className="text-white/50">متخصص فناوری اطلاعات</p>
                  <p className="text-xs text-white/30 mt-1">
                    کد متخصص: {selectedSpecialist.ID}
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h4 className="font-semibold text-white/70 mb-3 flex items-center gap-2">
                  <span>📞</span> اطلاعات تماس
                </h4>
                <div className="space-y-2 pr-4">
                  <p className="text-white/70">
                    <span className="font-medium">شماره تماس:</span>{" "}
                    <span dir="ltr" className="font-mono">
                      {getPhoneNumber(selectedSpecialist)}
                    </span>
                  </p>
                  {getEmail(selectedSpecialist) !== "ایمیل ثبت نشده" && (
                    <p className="text-white/70">
                      <span className="font-medium">ایمیل:</span>{" "}
                      <span dir="ltr">{getEmail(selectedSpecialist)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {getSkillsArray(selectedSpecialist.skills).length > 0 && (
                <div>
                  <h4 className="font-semibold text-white/70 mb-3 flex items-center gap-2">
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
                  <h4 className="font-semibold text-white/70 mb-3 flex items-center gap-2">
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

            <div className="sticky bottom-0 bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                بستن
              </button>
              {getPhoneNumber(selectedSpecialist) !== "شماره تماس ثبت نشده" && (
                <button
                  onClick={() => {
                    window.location.href = `tel:${getPhoneNumber(selectedSpecialist)}`;
                  }}
                  className="px-4 py-2 bg-blue-500/30 text-white border border-blue-400/20 rounded-lg hover:bg-blue-500/40 transition flex items-center gap-2"
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
