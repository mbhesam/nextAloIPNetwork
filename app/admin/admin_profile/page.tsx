"use client";

import { useEffect, useState, useCallback } from "react";
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

// نقشه تبدیل استان‌ها به فارسی
const stateMap: { [key: string]: string } = {
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

// نقشه کامل شهرهای ایران به فارسی
const cityMap: { [key: string]: string } = {
  // تهران
  Tehran: "تهران",
  Karaj: "کرج",
  Eslamshahr: "اسلامشهر",
  Rey: "ری",
  Qods: "قدس",
  Malard: "ملارد",
  Shahriar: "شهریار",
  Varamin: "ورامین",

  // اصفهان
  Isfahan: "اصفهان",
  Kashan: "کاشان",
  Najafabad: "نجف‌آباد",
  Khomeynishahr: "خمینی‌شهر",
  Shahreza: "شهرضا",
  Falavarjan: "فلاورجان",
  Mobarakeh: "مبارکه",
  Shahinshahr: "شاهین‌شهر",

  // فارس
  Shiraz: "شیراز",
  Marvdasht: "مرودشت",
  Jahrom: "جهرم",
  Kazerun: "کازرون",
  Lar: "لار",
  Fasa: "فسا",
  Darab: "داراب",
  Sepidan: "سپیدان",

  // خراسان رضوی
  Mashhad: "مشهد",
  Nishapur: "نیشابور",
  Sabzevar: "سبزوار",
  "Torbat-e Heydarieh": "تربت حیدریه",
  "Torbat-e Jam": "تربت جام",
  Kashmar: "کاشمر",
  Gonabad: "گناباد",
  Quchan: "قوچان",
  Dargaz: "درگز",

  // خوزستان
  Ahvaz: "اهواز",
  Abadan: "آبادان",
  Khorramshahr: "خرمشهر",
  Dezful: "دزفول",
  Shushtar: "شوشتر",
  "Masjed Soleyman": "مسجد سلیمان",
  Behbahan: "بهبهان",
  Omidiyeh: "امیدیه",

  // کرمان
  Kerman: "کرمان",
  Sirjan: "سیرجان",
  Rafsanjan: "رفسنجان",
  Bam: "بم",
  Jiroft: "جیرفت",
  Zarand: "زرند",
  Kahnuj: "کهنوج",

  // کرمانشاه
  Kermanshah: "کرمانشاه",
  Kangavar: "کنگاور",
  Javanrud: "جوانرود",
  Paveh: "پاوه",

  // آذربایجان شرقی
  Tabriz: "تبریز",
  Maragheh: "مراغه",
  Marand: "مرند",
  Ahar: "اهر",
  Bonab: "بناب",
  Shabestar: "شبستر",
  Mianeh: "میانه",
  Sarāb: "سراب",

  // آذربایجان غربی
  Urmia: "ارومیه",
  Khoy: "خوی",
  Mahabad: "مهاباد",
  Bukan: "بوکان",
  Miandoab: "میاندوآب",
  Sardasht: "سردشت",
  Piranshahr: "پیرانشهر",

  // مازندران
  Sari: "ساری",
  Babol: "بابل",
  Amol: "آمل",
  Qaemshahr: "قائم‌شهر",
  Neka: "نکا",
  Tonekabon: "تنکابن",
  Ramsar: "رامسر",
  Nowshahr: "نوشهر",
  Chalus: "چالوس",

  // گیلان
  Rasht: "رشت",
  "Bandar-e Anzali": "بندر انزلی",
  Lahijan: "لاهیجان",
  "Astaneh-ye Ashrafiyeh": "آستانه اشرفیه",
  Rudsar: "رودسر",
  Talesh: "تالش",
  Fuman: "فومن",
  "Sowme'eh Sara": "صومعه سرا",

  // خراسان شمالی
  Bojnord: "بجنورد",
  Esfarayen: "اسفراین",
  Shirvan: "شیروان",

  // خراسان جنوبی
  Birjand: "بیرجند",
  Qaen: "قائن",
  Ferdows: "فردوس",

  // سیستان و بلوچستان
  Zahedan: "زاهدان",
  Iranshahr: "ایرانشهر",
  Chabahar: "چابهار",
  Zabol: "زابل",
  Khash: "خاش",
  Saravan: "سراوان",
  Nikshahr: "نیکشهر",

  // همدان
  Hamedan: "همدان",
  Malayer: "ملایر",
  Nahavand: "نهاوند",
  Tuyserkan: "تویسرکان",

  // قم
  Qom: "قم",

  // البرز
  Karaj: "کرج",
  Nazarabad: "نظرآباد",
  Hashtgerd: "هشتگرد",

  // قزوین
  Qazvin: "قزوین",
  Takestan: "تاکستان",
  Abyek: "آبیک",

  // اردبیل
  Ardabil: "اردبیل",
  Meshginshahr: "مشگین‌شهر",
  Parsabad: "پارس‌آباد",
  "Bileh Savar": "بیله سوار",

  // بوشهر
  Bushehr: "بوشهر",
  Borazjan: "برازجان",
  Kangan: "کنگان",
  Deylam: "دیلم",

  // چهارمحال و بختیاری
  "Shahr-e Kord": "شهرکرد",
  Borujen: "بروجن",
  Farsan: "فارسان",

  // زنجان
  Zanjan: "زنجان",
  Abhar: "ابهر",
  Khorramdarreh: "خرمدره",

  // سمنان
  Semnan: "سمنان",
  Shahrud: "شاهرود",
  Damghan: "دامغان",
  Garmsar: "گرمسار",

  // گلستان
  Gorgan: "گرگان",
  "Gonbad-e Kavus": "گنبد کاووس",
  "Aliabad-e Katul": "علی‌آباد کتول",
  Kordkuy: "کردکوی",
  "Bandar-e Torkaman": "بندر ترکمن",

  // کردستان
  Sanandaj: "سنندج",
  Marivan: "مریوان",
  Baneh: "بانه",
  Saqqez: "سقز",
  Bijar: "بیجار",

  // کهگیلویه و بویراحمد
  Yasuj: "یاسوج",
  Dehdasht: "دهدشت",
  Gachsaran: "گچساران",

  // لرستان
  Khorramabad: "خرم‌آباد",
  Borujerd: "بروجرد",
  Aligudarz: "الیگودرز",
  Kuhdasht: "کوهدشت",
  Dorud: "دورود",

  // مرکزی
  Arak: "اراک",
  Saveh: "ساوه",
  Khomeyn: "خمین",
  Mahallat: "محلات",
  Delijan: "دلیجان",

  // هرمزگان
  "Bandar Abbas": "بندرعباس",
  Minab: "میناب",
  "Bandar Lengeh": "بندر لنگه",
  Jask: "جاسک",
  Hajjiabad: "حاجی‌آباد",

  // یزد
  Yazd: "یزد",
  Meybod: "میبد",
  Ardakan: "اردکان",
  Bafq: "بافق",

  // ایلام
  Ilam: "ایلام",
  Dehloran: "دهلران",
  Mehran: "مهران",
};

// تبدیل انگلیسی به فارسی برای نمایش
const getPersianState = (state: string): string => {
  if (!state) return "";
  return stateMap[state] || state;
};

const getPersianCity = (city: string): string => {
  if (!city) return "";
  return cityMap[city] || city;
};

// تبدیل فارسی به انگلیسی برای ذخیره
const getEnglishState = (state: string): string => {
  if (!state) return "";
  const entry = Object.entries(stateMap).find(
    ([key, value]) => value === state,
  );
  return entry ? entry[0] : state;
};

const getEnglishCity = (city: string): string => {
  if (!city) return "";
  const entry = Object.entries(cityMap).find(([key, value]) => value === city);
  return entry ? entry[0] : city;
};

export default function AdminProfilePage() {
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
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<ProfileData>(profile);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<
    string | null
  >(null);
  const [uploading, setUploading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // State برای استان‌ها و شهرها
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // دریافت لیست استان‌ها
  const fetchStates = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/states`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // تبدیل به فارسی برای نمایش
        const persianStates = (Array.isArray(data) ? data : [])
          .filter((state: string) => stateMap[state])
          .map((state: string) => stateMap[state]);
        setStates(persianStates);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  // دریافت لیست شهرها بر اساس استان انتخاب شده
  const fetchCities = async (state: string) => {
    if (!state) {
      setCities([]);
      return;
    }

    // تبدیل فارسی به انگلیسی برای ارسال به API
    const englishState = getEnglishState(state);
    if (!englishState) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    const token = getAccessToken();
    if (!token) {
      setLoadingCities(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(englishState)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        // اگر API شهرها رو برگردوند، ازشون استفاده کن
        if (Array.isArray(data) && data.length > 0) {
          const persianCities = data
            .filter((city: string) => cityMap[city])
            .map((city: string) => cityMap[city]);
          setCities(persianCities);
        } else {
          // اگر API شهری برنگردوند، از map استفاده کن
          const allCities = Object.keys(cityMap)
            .filter((key) => {
              // پیدا کردن استان مربوط به شهر
              const englishStateForCity = getEnglishState(state);
              return true; // همه شهرها رو نشون بده
            })
            .map((key) => cityMap[key]);
          setCities(allCities);
        }
      } else {
        // اگر API خطا داد، از map استفاده کن
        const allCities = Object.values(cityMap);
        setCities(allCities);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      // در صورت خطا، از map استفاده کن
      const allCities = Object.values(cityMap);
      setCities(allCities);
    } finally {
      setLoadingCities(false);
    }
  };

  // دریافت اطلاعات کاربر
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchUserProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !user?.ID) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/${user.ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.name || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
          email: data.email || "",
          // تبدیل انگلیسی به فارسی برای نمایش
          city: getPersianCity(data.city || ""),
          state: getPersianState(data.state || ""),
          melliCode: data.melliCode || "",
        });
        if (data.profilePicture) {
          setCurrentProfilePicture(data.profilePicture);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.ID, getAccessToken]);

  // ذخیره اطلاعات کاربر
  const handleSaveProfile = async () => {
    const token = getAccessToken();
    if (!token || !user?.ID) return;

    try {
      // تبدیل فارسی به انگلیسی برای ذخیره در بک‌اند
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
          role: user?.role || "admin",
        }),
      });

      if (response.ok) {
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
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("❌ خطا در ارتباط با سرور");
    }
  };

  // شروع ویرایش
  const handleStartEdit = () => {
    setTempProfile(profile);
    setIsEditing(true);
    // اگر استان انتخاب شده است، شهرهای آن را بارگذاری کن
    if (profile.state) {
      fetchCities(profile.state);
    }
  };

  // تغییر استان در فرم ویرایش
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setTempProfile({ ...tempProfile, state: newState, city: "" });
    if (newState) {
      fetchCities(newState);
    } else {
      setCities([]);
    }
  };

  // آپلود عکس پروفایل
  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;

    const token = getAccessToken();
    if (!token || !user?.ID) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/users/${user.ID}/profile-picture`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentProfilePicture(data.profilePicture);
        setSelectedFile(null);
        setProfilePreview(null);
        alert("✅ عکس پروفایل با موفقیت آپلود شد");
      } else {
        alert("❌ خطا در آپلود عکس");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("❌ خطا در ارتباط با سرور");
    } finally {
      setUploading(false);
    }
  };

  // تغییر رمز عبور
  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      alert("لطفاً تمام فیلدهای رمز عبور را پر کنید");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    const token = getAccessToken();
    if (!token || !user?.ID) return;

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

      if (response.ok) {
        alert("✅ رمز عبور با موفقیت تغییر کرد");
        setPasswordData({ oldPassword: "", newPassword: "" });
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error || "رمز عبور قدیمی اشتباه است"}`);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("❌ خطا در ارتباط با سرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setTempProfile({
      ...tempProfile,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
        return;
      }
      const validTypes = ["image/png", "image/jpg", "image/jpeg"];
      if (!validTypes.includes(file.type)) {
        alert("فقط فرمت‌های PNG, JPG, JPEG مجاز هستند");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCities([]);
  };

  useEffect(() => {
    fetchUserProfile();
    fetchStates();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-30">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            👤 پروفایل ادمین
          </h1>
          <p className="text-gray-600 text-sm mt-1">اطلاعات شخصی شما</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg">اطلاعات شخصی</h2>
                <p className="text-indigo-100 text-sm">
                  مشاهده و ویرایش اطلاعات حساب کاربری
                </p>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          نام
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={tempProfile.name}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          نام خانوادگی
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={tempProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          شماره تلفن
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={tempProfile.phoneNumber}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ایمیل
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={tempProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          استان
                        </label>
                        <select
                          name="state"
                          value={tempProfile.state}
                          onChange={handleStateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">انتخاب کنید...</option>
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          شهر
                        </label>
                        <select
                          name="city"
                          value={tempProfile.city}
                          onChange={handleProfileChange}
                          disabled={!tempProfile.state || loadingCities}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        >
                          <option value="">انتخاب کنید...</option>
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {loadingCities && (
                          <p className="text-xs text-gray-400 mt-1">
                            در حال بارگذاری شهرها...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          کد ملی
                        </label>
                        <input
                          type="text"
                          name="melliCode"
                          value={tempProfile.melliCode}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
                      >
                        💾 ذخیره تغییرات
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          نام
                        </label>
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile.name || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          نام خانوادگی
                        </label>
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile.lastName || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          شماره تلفن
                        </label>
                        <p className="mt-1 text-gray-900 font-mono">
                          {profile.phoneNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          ایمیل
                        </label>
                        <p className="mt-1 text-gray-900">
                          {profile.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          کد ملی
                        </label>
                        <p className="mt-1 text-gray-900 font-mono">
                          {profile.melliCode || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={handleStartEdit}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
                      >
                        ✏️ ویرایش اطلاعات
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Profile Picture Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                <h2 className="text-white font-bold text-lg">تصویر پروفایل</h2>
                <p className="text-green-100 text-sm">آپلود عکس پروفایل</p>
              </div>
              <div className="p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : currentProfilePicture ? (
                    <img
                      src={currentProfilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-gray-400">👑</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {selectedFile && (
                  <button
                    onClick={handleUploadProfilePicture}
                    disabled={uploading}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    {uploading ? "در حال آپلود..." : "📤 آپلود عکس"}
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG, JPEG (حداکثر ۵ مگابایت)
                </p>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h2 className="text-white font-bold text-lg">
                  🔒 تغییر رمز عبور
                </h2>
                <p className="text-amber-100 text-sm">
                  امنیت حساب خود را افزایش دهید
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رمز عبور قدیمی
                  </label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        oldPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="رمز عبور فعلی را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رمز عبور جدید
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="رمز عبور جدید را وارد کنید (حداقل ۶ کاراکتر)"
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg disabled:opacity-50"
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
