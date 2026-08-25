"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ProfileData {
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  state: string;
  melliCode: string;
}

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

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

      /*
        API ممکن است مستقیماً آرایه برگرداند
        یا داخل data قرار داده باشد.
      */
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
        budget: 0
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
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="container mx-auto mt-30 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            👤 پروفایل من
          </h1>

          <p className="mt-1 text-sm text-gray-600">اطلاعات شخصی شما</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* =====================
              Main Profile
          ====================== */}

          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white">اطلاعات شخصی</h2>

                <p className="text-sm text-indigo-100">
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
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          نام
                        </label>

                        <input
                          type="text"
                          name="name"
                          value={tempProfile.name}
                          onChange={handleProfileChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          نام خانوادگی
                        </label>

                        <input
                          type="text"
                          name="lastName"
                          value={tempProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Phone / Email */}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          شماره تلفن
                        </label>

                        <input
                          type="tel"
                          name="phoneNumber"
                          value={tempProfile.phoneNumber}
                          onChange={handleProfileChange}
                          dir="ltr"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-left outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          ایمیل
                        </label>

                        <input
                          type="email"
                          name="email"
                          value={tempProfile.email}
                          onChange={handleProfileChange}
                          dir="ltr"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-left outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* State / City */}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          استان
                        </label>

                        <select
                          name="state"
                          value={tempProfile.state}
                          onChange={handleStateChange}
                          disabled={loadingStates}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">انتخاب کنید...</option>

                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>

                        {loadingStates && (
                          <p className="mt-1 text-xs text-gray-400">
                            در حال بارگذاری استان‌ها...
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          شهر
                        </label>

                        <select
                          name="city"
                          value={tempProfile.city}
                          onChange={handleCityChange}
                          disabled={!tempProfile.state || loadingCities}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">
                            {!tempProfile.state
                              ? "ابتدا استان را انتخاب کنید"
                              : loadingCities
                                ? "در حال بارگذاری..."
                                : "انتخاب کنید..."}
                          </option>

                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>

                        {tempProfile.state &&
                          !loadingCities &&
                          cities.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                              شهری برای این استان یافت نشد
                            </p>
                          )}
                      </div>
                    </div>

                    {/* National Code */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        کد ملی
                      </label>

                      <input
                        type="text"
                        name="melliCode"
                        value={tempProfile.melliCode}
                        onChange={handleProfileChange}
                        maxLength={10}
                        dir="ltr"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-left outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Buttons */}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="flex-1 rounded-lg bg-indigo-600 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        💾 ذخیره تغییرات
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
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
                        <label className="block text-sm font-medium text-gray-500">
                          نام
                        </label>

                        <p className="mt-1 font-medium text-gray-900">
                          {profile.name || "—"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          نام خانوادگی
                        </label>

                        <p className="mt-1 font-medium text-gray-900">
                          {profile.lastName || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Phone / Email */}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          شماره تلفن
                        </label>

                        <p
                          dir="ltr"
                          className="mt-1 text-right font-mono text-gray-900"
                        >
                          {profile.phoneNumber || "—"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          ایمیل
                        </label>

                        <p dir="ltr" className="mt-1 text-right text-gray-900">
                          {profile.email || "—"}
                        </p>
                      </div>
                    </div>

                    {/* State / City */}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          استان
                        </label>

                        <p className="mt-1 text-gray-900">
                          {profile.state || "—"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          شهر
                        </label>

                        <p className="mt-1 text-gray-900">
                          {profile.city || "—"}
                        </p>
                      </div>
                    </div>

                    {/* National Code */}

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        کد ملی
                      </label>

                      <p
                        dir="ltr"
                        className="mt-1 text-right font-mono text-gray-900"
                      >
                        {profile.melliCode || "—"}
                      </p>
                    </div>

                    {/* Edit */}

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
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

            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                <h2 className="text-lg font-bold text-white">تصویر پروفایل</h2>

                <p className="text-sm text-green-100">آپلود عکس پروفایل</p>
              </div>

              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gray-200">
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
                    <span className="text-5xl text-gray-400">👤</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleUploadProfilePicture}
                    disabled={uploading}
                    className="mt-3 w-full rounded-lg bg-green-600 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? "در حال آپلود..." : "📤 آپلود عکس"}
                  </button>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  PNG, JPG, JPEG (حداکثر ۵ مگابایت)
                </p>
              </div>
            </div>

            {/* =====================
                Change Password
            ====================== */}

            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h2 className="text-lg font-bold text-white">
                  🔒 تغییر رمز عبور
                </h2>

                <p className="text-sm text-amber-100">
                  امنیت حساب خود را افزایش دهید
                </p>
              </div>

              <div className="space-y-4 p-5">
                {/* Old Password */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                    placeholder="رمز عبور فعلی را وارد کنید"
                  />
                </div>

                {/* New Password */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full rounded-lg bg-amber-600 py-2 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
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
