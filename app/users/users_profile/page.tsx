"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

interface ProfileData {
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  state: string;
  melliCode: string;
}

/* =========================
   استان‌ها
========================= */

const stateMap: Record<string, string> = {
  "East Azerbaijan": "آذربایجان شرقی",
  "West Azerbaijan": "آذربایجان غربی",
  Ardabil: "اردبیل",
  Isfahan: "اصفهان",
  Alborz: "البرز",
  Ilam: "ایلام",
  Bushehr: "بوشهر",
  Tehran: "تهران",
  "Chaharmahal and Bakhtiari": "چهارمحال و بختیاری",
  "South Khorasan": "خراسان جنوبی",
  "Razavi Khorasan": "خراسان رضوی",
  "North Khorasan": "خراسان شمالی",
  Khuzestan: "خوزستان",
  Zanjan: "زنجان",
  Semnan: "سمنان",
  "Sistan and Baluchestan": "سیستان و بلوچستان",
  Fars: "فارس",
  Qazvin: "قزوین",
  Qom: "قم",
  Kurdistan: "کردستان",
  Kerman: "کرمان",
  Kermanshah: "کرمانشاه",
  "Kohgiluyeh and Boyer-Ahmad": "کهگیلویه و بویراحمد",
  Golestan: "گلستان",
  Gilan: "گیلان",
  Lorestan: "لرستان",
  Mazandaran: "مازندران",
  Markazi: "مرکزی",
  Hormozgan: "هرمزگان",
  Hamedan: "همدان",
  Yazd: "یزد",
};

/* =========================
   شهرها
========================= */

const cityMap: Record<string, string> = {
  Tehran: "تهران",
  Mashhad: "مشهد",
  Isfahan: "اصفهان",
  Shiraz: "شیراز",
  Tabriz: "تبریز",
  Karaj: "کرج",
  Qom: "قم",
  Ahvaz: "اهواز",
  Kermanshah: "کرمانشاه",
  Urmia: "ارومیه",
  Rasht: "رشت",
  Zahedan: "زاهدان",
  Hamedan: "همدان",
  Yazd: "یزد",
  Ardabil: "اردبیل",
  "Bandar Abbas": "بندرعباس",
  Arak: "اراک",
  Eslamshahr: "اسلامشهر",
  Qazvin: "قزوین",
  Zanjan: "زنجان",
  Sanandaj: "سنندج",
  Gorgan: "گرگان",
  Khorramabad: "خرم‌آباد",
  Bushehr: "بوشهر",
  Sari: "ساری",
  Babol: "بابل",
  Amol: "آمل",
  Nishapur: "نیشابور",
  Sabzevar: "سبزوار",
  Kashan: "کاشان",
  Rafsanjan: "رفسنجان",
  Sirjan: "سیرجان",
  Malard: "ملارد",
  Varamin: "ورامین",
  Qods: "قدس",
  Shahriar: "شهریار",
  Rey: "ری",
  "Shahr-e Kord": "شهرکرد",
  Yasuj: "یاسوج",
  Birjand: "بیرجند",
  Bojnord: "بجنورد",
  Semnan: "سمنان",
  Zabol: "زابل",
  Kashmar: "کاشمر",
  "Gonbad-e Kavus": "گنبد کاووس",
  Shahrud: "شاهرود",
  Maragheh: "مراغه",
  Khoy: "خوی",
};

/* =========================
   تبدیل فارسی / انگلیسی
========================= */

const getPersianState = (state: string) => {
  if (!state) return "";
  return stateMap[state] || state;
};

const getPersianCity = (city: string) => {
  if (!city) return "";
  return cityMap[city] || city;
};

const getEnglishState = (state: string) => {
  if (!state) return "";
  const entry = Object.entries(stateMap).find(([, value]) => value === state);
  return entry ? entry[0] : state;
};

const getEnglishCity = (city: string) => {
  if (!city) return "";
  const entry = Object.entries(cityMap).find(([, value]) => value === city);
  return entry ? entry[0] : city;
};

/* =========================
   Component
========================= */

export default function UserProfilePage() {
  const { user, getAccessToken, updateUser } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    city: "",
    state: "",
    melliCode: "",
  });

  const [tempProfile, setTempProfile] = useState<ProfileData>(profile);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  /* عکس */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<
    string | null
  >(null);
  const [uploading, setUploading] = useState(false);

  /* رمز عبور */
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  /* استان و شهر */
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  /* =========================
     دریافت استان‌ها
  ========================= */

  const fetchStates = useCallback(async () => {
    setLoadingStates(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/states`);
      if (!response.ok) {
        throw new Error("Failed to fetch states");
      }
      const data = await response.json();

      const stateList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const persianStates = stateList
        .map((state: unknown) => {
          if (typeof state === "string") {
            return getPersianState(state);
          }
          if (typeof state === "object" && state !== null) {
            const item = state as Record<string, unknown>;
            const value = item.name || item.state || item.title;
            return typeof value === "string" ? getPersianState(value) : "";
          }
          return "";
        })
        .filter(Boolean);

      setStates(
        persianStates.length > 0 ? persianStates : Object.values(stateMap),
      );
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates(Object.values(stateMap));
    } finally {
      setLoadingStates(false);
    }
  }, []);

  /* =========================
     دریافت شهرها
  ========================= */

  const fetchCities = useCallback(async (stateName: string) => {
    if (!stateName) {
      setCities([]);
      return;
    }

    const englishState = getEnglishState(stateName);
    if (!englishState) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(englishState)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }
      const data = await response.json();

      const cityList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const persianCities = cityList
        .map((city: unknown) => {
          if (typeof city === "string") {
            return getPersianCity(city);
          }
          if (typeof city === "object" && city !== null) {
            const item = city as Record<string, unknown>;
            const value = item.name || item.city || item.title;
            return typeof value === "string" ? getPersianCity(value) : "";
          }
          return "";
        })
        .filter(Boolean);

      setCities(persianCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  /* =========================
     دریافت پروفایل
  ========================= */

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchUserProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !user?.ID) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/${user.ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();

      const profileData: ProfileData = {
        name: data.name || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        email: data.email || "",
        city: getPersianCity(data.city || ""),
        state: getPersianState(data.state || ""),
        melliCode: data.melliCode || "",
      };

      setProfile(profileData);
      setTempProfile(profileData);

      if (data.profilePicture) {
        setCurrentProfilePicture(data.profilePicture);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.ID, getAccessToken]);

  /* =========================
     ذخیره اطلاعات
  ========================= */

  const handleSaveProfile = async () => {
    const token = getAccessToken();
    if (!token || !user?.ID) {
      alert("❌ اطلاعات ورود کاربر پیدا نشد");
      return;
    }

    try {
      const englishState = getEnglishState(tempProfile.state);
      const englishCity = getEnglishCity(tempProfile.city);

      const response = await fetch(`${API_BASE_URL}/v1/user/${user.ID}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tempProfile.name,
          lastName: tempProfile.lastName,
          phoneNumber: tempProfile.phoneNumber,
          email: tempProfile.email,
          city: englishCity || tempProfile.city,
          state: englishState || tempProfile.state,
          melliCode: tempProfile.melliCode,
          budget: user?.budget || 0,
          type: "national",
          role: user?.role || "customer",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "خطا در ذخیره اطلاعات");
      }

      setProfile(tempProfile);
      updateUser({
        ID: user.ID,
        name: tempProfile.name,
        lastName: tempProfile.lastName,
        phoneNumber: tempProfile.phoneNumber,
        email: tempProfile.email,
        role: user.role,
        budget: 0,
      });

      setIsEditing(false);
      alert("✅ اطلاعات با موفقیت ذخیره شد");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(
        `❌ ${
          error instanceof Error ? error.message : "خطا در ارتباط با سرور"
        }`,
      );
    }
  };

  /* =========================
     شروع ویرایش
  ========================= */

  const handleStartEdit = () => {
    setTempProfile(profile);
    setIsEditing(true);
    if (profile.state) {
      fetchCities(profile.state);
    }
  };

  /* =========================
     تغییر استان
  ========================= */

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setTempProfile((prev) => ({
      ...prev,
      state: newState,
      city: "",
    }));
    fetchCities(newState);
  };

  /* =========================
     تغییر شهر
  ========================= */

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTempProfile((prev) => ({
      ...prev,
      city: e.target.value,
    }));
  };

  /* =========================
     تغییر فیلدها
  ========================= */

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     آپلود عکس
  ========================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("❌ حجم فایل نباید بیشتر از ۵ مگابایت باشد");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/png", "image/jpg", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      alert("❌ فقط فرمت‌های PNG, JPG, JPEG مجاز هستند");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* =========================
     ارسال عکس
  ========================= */

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;

    const token = getAccessToken();
    if (!token || !user?.ID) {
      alert("❌ اطلاعات ورود کاربر پیدا نشد");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/v1/users/${user.ID}/profile-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "خطا در آپلود عکس");
      }

      const data = await response.json();
      if (data.profilePicture) {
        setCurrentProfilePicture(data.profilePicture);
      }

      setSelectedFile(null);
      setProfilePreview(null);
      alert("✅ عکس پروفایل با موفقیت آپلود شد");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert(
        `❌ ${
          error instanceof Error ? error.message : "خطا در ارتباط با سرور"
        }`,
      );
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     تغییر رمز
  ========================= */

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      alert("❌ لطفاً تمام فیلدهای رمز عبور را پر کنید");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("❌ رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    const token = getAccessToken();
    if (!token || !user?.ID) {
      alert("❌ اطلاعات ورود کاربر پیدا نشد");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/user/${user.ID}/password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "رمز عبور قدیمی اشتباه است");
      }

      alert("✅ رمز عبور با موفقیت تغییر کرد");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      alert(
        `❌ ${
          error instanceof Error ? error.message : "خطا در ارتباط با سرور"
        }`,
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* =========================
     لغو ویرایش
  ========================= */

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempProfile(profile);
    setCities([]);
  };

  /* =========================
     بارگذاری اولیه
  ========================= */

  useEffect(() => {
    fetchUserProfile();
    fetchStates();
  }, [fetchUserProfile, fetchStates]);

  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div
      className="min-h-screen  from-blue-900 via-indigo-800 to-blue-950 p-4 md:p-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 container mx-auto mt-30 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white/90 sm:text-3xl">
            👤 پروفایل من
          </h1>
          <p className="mt-1 text-sm text-white/50">اطلاعات شخصی شما</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* =====================
              Main Profile
          ====================== */}

          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-blue-500/5">
              <div className="bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">اطلاعات شخصی</h2>
                <p className="text-sm text-indigo-200">
                  مشاهده و ویرایش اطلاعات حساب کاربری
                </p>
              </div>

              <div className="p-6">
                {isEditing ? (
                  /* =====================
                     EDIT MODE
                  ====================== */

                  <div className="space-y-5">
                    {/* Name */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">
                          نام
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={tempProfile.name}
                          onChange={handleProfileChange}
                          className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">
                          نام خانوادگی
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={tempProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    {/* Phone / Email */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">
                          شماره تلفن
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={tempProfile.phoneNumber}
                          onChange={handleProfileChange}
                          dir="ltr"
                          className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-left text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">
                          ایمیل
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={tempProfile.email}
                          onChange={handleProfileChange}
                          dir="ltr"
                          className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-left text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        استان
                      </label>
                      <select
                        name="state"
                        value={tempProfile.state}
                        onChange={handleStateChange}
                        disabled={loadingStates}
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
                          style={{ backgroundColor: "#4a4a4a", color: "white" }}
                        >
                          انتخاب کنید...
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
                      {loadingStates && (
                        <p className="mt-1 text-xs text-white/40">
                          در حال بارگذاری استان‌ها...
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        شهر
                      </label>
                      <select
                        name="city"
                        value={tempProfile.city}
                        onChange={handleCityChange}
                        disabled={!tempProfile.state || loadingCities}
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
                          style={{ backgroundColor: "#4a4a4a", color: "white" }}
                        >
                          {!tempProfile.state
                            ? "ابتدا استان را انتخاب کنید"
                            : loadingCities
                              ? "در حال بارگذاری..."
                              : "انتخاب کنید..."}
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
                      {tempProfile.state &&
                        !loadingCities &&
                        cities.length === 0 && (
                          <p className="mt-1 text-xs text-amber-300">
                            شهری برای این استان یافت نشد
                          </p>
                        )}
                    </div>

                    {/* National Code */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        کد ملی
                      </label>
                      <input
                        type="text"
                        name="melliCode"
                        value={tempProfile.melliCode}
                        onChange={handleProfileChange}
                        maxLength={10}
                        dir="ltr"
                        className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-left text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="flex-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 py-2 font-medium text-white transition-colors"
                      >
                        💾 ذخیره تغییرات
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg bg-white/10 hover:bg-white/20 px-6 py-2 font-medium text-white/80 transition-colors border border-white/10"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  /* =====================
                     VIEW MODE
                  ====================== */

                  <div className="space-y-5">
                    {/* Name */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          نام
                        </label>
                        <p className="mt-1 font-medium text-white/90">
                          {profile.name || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          نام خانوادگی
                        </label>
                        <p className="mt-1 font-medium text-white/90">
                          {profile.lastName || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Phone / Email */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          شماره تلفن
                        </label>
                        <p
                          dir="ltr"
                          className="mt-1 text-right font-mono text-white/90"
                        >
                          {profile.phoneNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          ایمیل
                        </label>
                        <p dir="ltr" className="mt-1 text-right text-white/90">
                          {profile.email || "—"}
                        </p>
                      </div>
                    </div>

                    {/* State / City */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-white/50">
                          استان
                        </label>
                        <p className="mt-1 text-white/90">
                          {profile.state || "—"}
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

                    {/* National Code */}
                    <div>
                      <label className="block text-sm font-medium text-white/50">
                        کد ملی
                      </label>
                      <p
                        dir="ltr"
                        className="mt-1 text-right font-mono text-white/90"
                      >
                        {profile.melliCode || "—"}
                      </p>
                    </div>

                    {/* Edit */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-600 py-2 font-medium text-white transition-colors"
                      >
                        ✏️ ویرایش اطلاعات
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =====================
              SIDEBAR
          ====================== */}

          <div className="space-y-6">
            {/* =====================
                Profile Picture
            ====================== */}

            <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-blue-500/5">
              <div className="bg-gradient-to-r from-green-500/80 to-teal-500/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">تصویر پروفایل</h2>
                <p className="text-sm text-green-200">آپلود عکس پروفایل</p>
              </div>

              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white/10 border border-white/20">
                  {profilePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePreview}
                      alt="Profile Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : currentProfilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentProfilePicture}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-white/40">👤</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-300 hover:file:bg-indigo-500/30"
                />

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleUploadProfilePicture}
                    disabled={uploading}
                    className="mt-3 w-full rounded-lg bg-green-500 hover:bg-green-600 py-2 font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {uploading ? "در حال آپلود..." : "📤 آپلود عکس"}
                  </button>
                )}

                <p className="mt-2 text-xs text-white/30">
                  PNG, JPG, JPEG (حداکثر ۵ مگابایت)
                </p>
              </div>
            </div>

            {/* =====================
                Change Password
            ====================== */}

            <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-blue-500/5">
              <div className="bg-gradient-to-r from-amber-500/80 to-orange-500/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">
                  🔒 تغییر رمز عبور
                </h2>
                <p className="text-sm text-amber-200">
                  امنیت حساب خود را افزایش دهید
                </p>
              </div>

              <div className="space-y-4 p-5">
                {/* Old Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    رمز عبور قدیمی
                  </label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        oldPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white placeholder-white/40 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="رمز عبور فعلی را وارد کنید"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    رمز عبور جدید
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white placeholder-white/40 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 py-2 font-medium text-white transition-colors disabled:opacity-50"
                >
                  {changingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
