// app/specialist/profile/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
}

interface User {
  ID: number;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  city: string;
  state: string;
  role: string;
  authorized: boolean;
  type: string;
  budget: number;
  melliCode: string;
  profilePicture: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  skills: string;
  categoryIds: number[];
  melliCode: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function SpecialistProfilePage() {
  const { getAccessToken, user: authUser, logout } = useAuth();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    province: "",
    skills: "",
    categoryIds: [],
    melliCode: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<ProfileData>(profile);

  const fetchStates = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/states`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const statesArray = Array.isArray(data)
          ? data
          : data.data || data.states || [];
        setStates(statesArray);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchCities = async (state: string) => {
    const token = getAccessToken();
    if (!token || !state) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(state)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const citiesArray = Array.isArray(data)
          ? data
          : data.data || data.cities || [];
        setCities(citiesArray);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchCategories = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const categoriesArray = Array.isArray(data)
          ? data
          : data.data || data.categories || [];
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCurrentUser = async () => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const usersResponse = await fetch(
        `${API_BASE_URL}/v1/users?limit=100&offset=0`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersArray = Array.isArray(usersData)
          ? usersData
          : usersData.data || usersData.users || [];

        let currentUser = null;

        if (authUser?.ID) {
          currentUser = usersArray.find(
            (user: User) => user.ID === authUser.ID,
          );
        }

        if (!currentUser && authUser?.email) {
          currentUser = usersArray.find(
            (user: User) => user.email === authUser.email,
          );
        }

        return currentUser;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    return null;
  };

  const fetchSpecialistForUser = async (userId: number) => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const specialistsResponse = await fetch(
        `${API_BASE_URL}/v1/specialists?limit=100&offset=0`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (specialistsResponse.ok) {
        const specialistsData = await specialistsResponse.json();
        const specialistsArray = Array.isArray(specialistsData)
          ? specialistsData
          : specialistsData.data || specialistsData.specialists || [];

        const currentSpecialist = specialistsArray.find(
          (spec: Specialist) => spec.UserID === userId,
        );

        return currentSpecialist;
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    }
    return null;
  };

  const loadData = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("لطفاً وارد حساب کاربری خود شوید");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentUser = await fetchCurrentUser();

      if (!currentUser) {
        setError("اطلاعات کاربر یافت نشد");
        setLoading(false);
        return;
      }

      setUserInfo(currentUser);

      const currentSpecialist = await fetchSpecialistForUser(currentUser.ID);

      if (currentSpecialist) {
        setSpecialist(currentSpecialist);
      }

      const profileData: ProfileData = {
        firstName: currentUser.name || "",
        lastName: currentUser.lastName || "",
        phone: currentUser.phoneNumber || "",
        email: currentUser.email || "",
        city: currentUser.city || "",
        province: currentUser.state || "",
        skills: currentSpecialist?.skills || "",
        categoryIds:
          currentSpecialist?.Categories?.map((cat: Category) => cat.id) || [],
        melliCode: currentUser.melliCode || "",
      };

      setProfile(profileData);
      setTempProfile(profileData);

      if (profileData.province) {
        await fetchCities(profileData.province);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const updateOrCreateSpecialist = async () => {
    const token = getAccessToken();
    if (!token || !userInfo) return false;

    try {
      let response;
      const specialistData = {
        skills: tempProfile.skills,
        categoryIds: tempProfile.categoryIds,
        userId: userInfo.ID,
      };

      if (specialist) {
        response = await fetch(
          `${API_BASE_URL}/v1/specialist/${specialist.ID}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(specialistData),
          },
        );
      } else {
        response = await fetch(`${API_BASE_URL}/v1/specialist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(specialistData),
        });
      }

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      if (!specialist) {
        setSpecialist(result);
      }
      return true;
    } catch (error) {
      console.error("Error in specialist operation:", error);
      return false;
    }
  };

  const changePassword = async () => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error changing password:", error);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchStates();
      await fetchCategories();
      await loadData();
    };
    init();
  }, [authUser]);

  const handleProfileChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...prev, [name]: value }));

    if (name === "province") {
      setTempProfile((prev) => ({ ...prev, city: "" }));
      if (value) {
        fetchCities(value);
      } else {
        setCities([]);
      }
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setTempProfile((prev) => {
      const newCategoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return { ...prev, categoryIds: newCategoryIds };
    });
  };

  const handleSaveProfile = async () => {
    if (!tempProfile.firstName || !tempProfile.lastName) {
      alert("⚠️ لطفاً نام و نام خانوادگی را وارد کنید");
      return;
    }

    setSaving(true);

    try {
      const specialistSuccess = await updateOrCreateSpecialist();

      if (specialistSuccess) {
        setProfile(tempProfile);
        setIsEditing(false);
        alert("✅ اطلاعات با موفقیت ذخیره شد");
        await loadData();
      } else {
        alert("❌ خطا در ذخیره اطلاعات");
      }
    } catch (error) {
      console.error("Error in save process:", error);
      alert("❌ خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      alert("⚠️ لطفاً تمام فیلدهای رمز عبور را پر کنید");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("⚠️ رمز عبور جدید و تکرار آن مطابقت ندارند");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("⚠️ رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    const success = await changePassword();
    if (success) {
      alert("✅ رمز عبور با موفقیت تغییر کرد");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      alert("❌ خطا در تغییر رمز عبور. رمز عبور قدیمی را بررسی کنید");
    }
  };

  const handleLogout = () => {
    if (confirm("آیا از خروج از حساب کاربری مطمئن هستید؟")) {
      logout();
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-6 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-200 mb-2">خطا</h2>
          <p className="text-red-200/80 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/30 text-red-200 border border-red-400/30 rounded-lg hover:bg-red-500/40 transition"
          >
            تلاش مجدد
          </button>
        </div>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white/90">
              👤 پروفایل من
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {userInfo?.name
                ? `${userInfo.name} ${userInfo.lastName || ""} عزیز، خوش آمدید`
                : "مشاهده و ویرایش اطلاعات شخصی"}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500/20 text-white rounded-lg hover:bg-blue-500/30 transition border border-blue-400/20 flex items-center gap-2"
            >
              ✏️ ویرایش اطلاعات
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">اطلاعات شخصی</h2>
                <p className="text-indigo-200 text-sm">
                  اطلاعات حساب کاربری شما
                </p>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          نام
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={tempProfile.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          نام خانوادگی
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={tempProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          شماره تلفن
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={tempProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          ایمیل
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={tempProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          کد ملی
                        </label>
                        <input
                          type="text"
                          name="melliCode"
                          value={tempProfile.melliCode}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          استان
                        </label>
                        <select
                          name="province"
                          value={tempProfile.province}
                          onChange={handleProfileChange}
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
                          <option
                            value=""
                            style={{
                              backgroundColor: "#4a4a4a",
                              color: "white",
                            }}
                          >
                            انتخاب استان
                          </option>
                          {states.map((state) => (
                            <option
                              key={state}
                              value={state}
                              style={{
                                backgroundColor: "#4a4a4a",
                                color: "white",
                              }}
                            >
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          شهر
                        </label>
                        <select
                          name="city"
                          value={tempProfile.city}
                          onChange={handleProfileChange}
                          disabled={
                            !tempProfile.province || cities.length === 0
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
                          <option
                            value=""
                            style={{
                              backgroundColor: "#4a4a4a",
                              color: "white",
                            }}
                          >
                            انتخاب شهر
                          </option>
                          {cities.map((city) => (
                            <option
                              key={city}
                              value={city}
                              style={{
                                backgroundColor: "#4a4a4a",
                                color: "white",
                              }}
                            >
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        مهارت‌ها
                      </label>
                      <textarea
                        name="skills"
                        value={tempProfile.skills}
                        onChange={handleProfileChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        placeholder="مهارت‌های خود را وارد کنید (با کاما جدا کنید)"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        مثال: juniper, voip, mpls, ccna
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        دسته‌بندی‌های تخصصی
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-3 py-1 text-sm rounded-full transition ${
                              tempProfile.categoryIds.includes(cat.id)
                                ? "bg-blue-500/40 text-white border border-blue-400/30"
                                : "bg-white/10 text-white/60 border border-white/10 hover:bg-white/20"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "⏳ در حال ذخیره..." : "💾 ذخیره تغییرات"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg font-medium transition-colors disabled:opacity-50 border border-white/10"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          نام
                        </label>
                        <p className="mt-1 text-white/90 font-medium">
                          {profile.firstName || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          نام خانوادگی
                        </label>
                        <p className="mt-1 text-white/90 font-medium">
                          {profile.lastName || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          شماره تلفن
                        </label>
                        <p className="mt-1 text-white/90 font-mono">
                          {profile.phone || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          ایمیل
                        </label>
                        <p className="mt-1 text-white/90">
                          {profile.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          کد ملی
                        </label>
                        <p className="mt-1 text-white/90 font-mono">
                          {profile.melliCode || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          استان
                        </label>
                        <p className="mt-1 text-white/90">
                          {profile.province || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          شهر
                        </label>
                        <p className="mt-1 text-white/90">
                          {profile.city || "—"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/50">
                        مهارت‌ها
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.skills.split(",").map(
                          (skill, index) =>
                            skill.trim() && (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/20"
                              >
                                {skill.trim()}
                              </span>
                            ),
                        )}
                      </div>
                    </div>

                    {profile.categoryIds.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          دسته‌بندی‌ها
                        </label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {categories
                            .filter((cat) =>
                              profile.categoryIds.includes(cat.id),
                            )
                            .map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/20"
                              >
                                {cat.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Change Password Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500/80 to-orange-500/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">
                  🔒 تغییر رمز عبور
                </h2>
                <p className="text-amber-200 text-sm">
                  امنیت حساب خود را افزایش دهید
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    رمز عبور قدیمی
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="رمز عبور فعلی را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    رمز عبور جدید
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="رمز عبور جدید را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    تکرار رمز عبور جدید
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="رمز عبور جدید را مجدداً وارد کنید"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="w-full bg-amber-500/30 hover:bg-amber-500/40 text-white border border-amber-400/20 py-2 rounded-lg font-medium transition-colors"
                >
                  تغییر رمز عبور
                </button>
              </div>
            </div>

            {/* Logout Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500/80 to-red-600/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">
                  🚪 خروج از حساب
                </h2>
                <p className="text-red-200 text-sm">
                  از حساب کاربری خود خارج شوید
                </p>
              </div>
              <div className="p-5">
                <p className="text-white/50 text-sm mb-4">
                  پس از خروج، برای دسترسی مجدد به حساب خود نیاز به وارد کردن
                  اطلاعات ورود خواهید داشت.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500/30 hover:bg-red-500/40 text-white border border-red-400/20 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  🚪 خروج از حساب کاربری
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
