// app/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    nationalCode: "",
    accountType: "national",
    agreeTerms: false,
    state: "",
    city: "",
    // فیلدهای مخصوص کاربر حقوقی
    companyName: "",
    economicCode: "",
    registrationNumber: "",
    address: "",
    companyPhone: "",
    website: "",
    agentName1: "",
    agentPhone1: "",
    agentName2: "",
    agentPhone2: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");

  // State های مربوط به استان و شهر
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // دریافت لیست استان‌ها
  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/states`);
      if (response.ok) {
        const data = await response.json();
        setStates(data);
        if (data.length > 0 && !formData.state) {
          setFormData((prev) => ({ ...prev, state: data[0] }));
          fetchCities(data[0]);
        }
      } else {
        console.error("Failed to fetch states");
        const fallbackStates = [
          "Tehran",
          "Isfahan",
          "Mashhad",
          "Shiraz",
          "Tabriz",
          "Karaj",
          "Qom",
          "Ahvaz",
          "Kermanshah",
          "Urmia",
        ];
        setStates(fallbackStates);
        if (!formData.state) {
          setFormData((prev) => ({ ...prev, state: fallbackStates[0] }));
          fetchCities(fallbackStates[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoadingStates(false);
    }
  };

  // دریافت لیست شهرها بر اساس استان انتخاب شده
  const fetchCities = async (stateName: string) => {
    if (!stateName) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(stateName)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCities(data);
        if (formData.city && !data.includes(formData.city)) {
          setFormData((prev) => ({ ...prev, city: data[0] || "" }));
        } else if (data.length > 0 && !formData.city) {
          setFormData((prev) => ({ ...prev, city: data[0] }));
        }
      } else {
        console.error("Failed to fetch cities");
        setCities([]);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    if (formData.state) {
      fetchCities(formData.state);
    }
  }, [formData.state]);

  useEffect(() => {
    fetchStates();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (serverError) {
      setServerError("");
    }
  };

  // اعتبارسنجی کد ملی
  const validateNationalCode = (code: string): boolean => {
    if (!/^\d{10}$/.test(code)) return false;

    const check = parseInt(code.charAt(9));
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(code.charAt(i)) * (10 - i);
    }
    const remainder = sum % 11;
    if (remainder < 2) {
      return check === remainder;
    } else {
      return check === 11 - remainder;
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // فیلدهای مشترک
    if (!formData.firstName.trim()) {
      newErrors.firstName = "نام را وارد کنید";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "نام باید حداقل ۲ کاراکتر باشد";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "نام خانوادگی را وارد کنید";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "نام خانوادگی باید حداقل ۲ کاراکتر باشد";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "شماره تلفن را وارد کنید";
    } else if (!/^09[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = "شماره تلفن معتبر نیست (مثال: 09123456789)";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "ایمیل معتبر نیست";
    }

    if (!formData.password) {
      newErrors.password = "رمز عبور را وارد کنید";
    } else if (formData.password.length < 6) {
      newErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "رمز عبور و تکرار آن مطابقت ندارند";
    }

    if (!formData.state) {
      newErrors.state = "لطفاً استان را انتخاب کنید";
    }

    if (!formData.city) {
      newErrors.city = "لطفاً شهر را انتخاب کنید";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "باید قوانین و مقررات را بپذیرید";
    }

    // اعتبارسنجی بر اساس نوع حساب
    if (formData.accountType === "national") {
      if (!formData.nationalCode.trim()) {
        newErrors.nationalCode = "کد ملی را وارد کنید";
      } else if (!validateNationalCode(formData.nationalCode)) {
        newErrors.nationalCode = "کد ملی معتبر نیست";
      }
    } else {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "نام شرکت را وارد کنید";
      }
      if (!formData.registrationNumber.trim()) {
        newErrors.registrationNumber = "شماره ثبت را وارد کنید";
      }
      if (!formData.companyPhone.trim()) {
        newErrors.companyPhone = "شماره تلفن شرکت را وارد کنید";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      // مرحله 1: ثبت‌نام کاربر عادی
      const userPayload: any = {
        name: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phone.trim(),
        email: formData.email.trim() || "",
        password: formData.password,
        type: formData.accountType,
        role: "customer",
        budget: 0,
        city: formData.city,
        state: formData.state,
      };

      if (formData.accountType === "national") {
        userPayload.melliCode = formData.nationalCode.trim();
      } else {
        userPayload.melliCode = "";
      }

      console.log("Step 1: Creating user...");
      const userResponse = await fetch(`${API_BASE_URL}/v1/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userPayload),
      });

      const userResponseText = await userResponse.text();
      let userData;
      try {
        userData = JSON.parse(userResponseText);
      } catch (e) {
        userData = userResponseText;
      }

      if (!userResponse.ok) {
        let errorMessage =
          typeof userData === "object" && userData?.error
            ? userData.error
            : userResponseText;
        setServerError(`خطا در ثبت‌نام: ${errorMessage}`);
        setIsLoading(false);
        return;
      }

      const newUserId = userData.ID || userData.id;
      console.log("User created with ID:", newUserId);

      // مرحله 2: اگر کاربر حقوقی است، اطلاعات شرکت را ثبت کن
      if (formData.accountType === "legal" && newUserId) {
        console.log("Step 2: Creating legal user...");

        const legalPayload = {
          userId: newUserId,
          companyName: formData.companyName.trim(),
          officialRegisterNumber: formData.registrationNumber.trim(),
          address: formData.address?.trim() || "",
          website: formData.website?.trim() || "",
          CompanyPhoneNumber: formData.companyPhone.trim(),
          agentName1: formData.agentName1?.trim() || "",
          AgentPhoneNumber1: formData.agentPhone1?.trim() || "",
          agentName2: formData.agentName2?.trim() || "",
          AgentPhoneNumber2: formData.agentPhone2?.trim() || "",
        };

        console.log("Legal payload:", legalPayload);

        const legalResponse = await fetch(`${API_BASE_URL}/v1/legal-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(legalPayload),
        });

        const legalResponseText = await legalResponse.text();
        console.log("Legal response status:", legalResponse.status);
        console.log("Legal response:", legalResponseText);

        if (!legalResponse.ok) {
          let errorMessage = `اطلاعات کاربر ثبت شد اما خطا در ثبت اطلاعات شرکت: ${legalResponse.status}`;
          setServerError(errorMessage);
          alert(
            "⚠️ حساب کاربری ایجاد شد اما اطلاعات شرکت ثبت نشد. لطفاً با پشتیبانی تماس بگیرید.",
          );
          router.push("/login");
          return;
        }
      }

      // موفقیت آمیز
      const successMessage =
        formData.accountType === "national"
          ? "✅ ثبت‌نام با موفقیت انجام شد. لطفاً وارد شوید."
          : "✅ ثبت‌نام شرکت با موفقیت انجام شد. لطفاً وارد شوید.";
      alert(successMessage);
      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setServerError("خطا در ارتباط با سرور. لطفاً اینترنت خود را بررسی کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">✨ ثبت‌نام</h1>
              <p className="text-gray-500 text-sm mt-1">
                عضو خانواده AloIPNetwork شوید
              </p>
            </div>

            {serverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                ❌ {serverError}
              </div>
            )}

            {/* Account Type Selector */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    accountType: "national",
                    companyName: "",
                    registrationNumber: "",
                    companyPhone: "",
                    address: "",
                    website: "",
                    agentName1: "",
                    agentPhone1: "",
                    agentName2: "",
                    agentPhone2: "",
                  })
                }
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  formData.accountType === "national"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                👤 حساب حقیقی
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    accountType: "legal",
                    nationalCode: "",
                  })
                }
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  formData.accountType === "legal"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🏢 حساب حقوقی
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="علی"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="رضایی"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره تلفن *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09123456789"
                    dir="ltr"
                    maxLength={11}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ایمیل (اختیاری)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    dir="ltr"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رمز عبور *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="حداقل ۶ کاراکتر"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تکرار رمز عبور *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="رمز عبور را مجدد وارد کنید"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Fields based on account type */}
              {formData.accountType === "national" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد ملی *
                  </label>
                  <input
                    type="text"
                    name="nationalCode"
                    value={formData.nationalCode}
                    onChange={handleChange}
                    placeholder="1234567890"
                    dir="ltr"
                    maxLength={10}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.nationalCode ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.nationalCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nationalCode}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام شرکت *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="نام شرکت خود را وارد کنید"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                        errors.companyName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شماره ثبت *
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="شماره ثبت"
                        dir="ltr"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                          errors.registrationNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.registrationNumber && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.registrationNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تلفن شرکت *
                      </label>
                      <input
                        type="tel"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleChange}
                        placeholder="02112345678"
                        dir="ltr"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                          errors.companyPhone
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.companyPhone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.companyPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      آدرس شرکت
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="آدرس کامل شرکت"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وب‌سایت
                      </label>
                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        dir="ltr"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        کد اقتصادی
                      </label>
                      <input
                        type="text"
                        name="economicCode"
                        value={formData.economicCode}
                        onChange={handleChange}
                        placeholder="کد اقتصادی"
                        dir="ltr"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نام نماینده 1
                      </label>
                      <input
                        type="text"
                        name="agentName1"
                        value={formData.agentName1}
                        onChange={handleChange}
                        placeholder="نام نماینده"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تلفن نماینده 1
                      </label>
                      <input
                        type="tel"
                        name="agentPhone1"
                        value={formData.agentPhone1}
                        onChange={handleChange}
                        placeholder="09123456789"
                        dir="ltr"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نام نماینده 2
                      </label>
                      <input
                        type="text"
                        name="agentName2"
                        value={formData.agentName2}
                        onChange={handleChange}
                        placeholder="نام نماینده"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تلفن نماینده 2
                      </label>
                      <input
                        type="tel"
                        name="agentPhone2"
                        value={formData.agentPhone2}
                        onChange={handleChange}
                        placeholder="09123456789"
                        dir="ltr"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* State and City Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    استان *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={loadingStates}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">انتخاب کنید...</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {loadingStates && (
                    <p className="text-xs text-gray-400 mt-1">
                      در حال بارگذاری...
                    </p>
                  )}
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شهر *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!formData.state || loadingCities}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">
                      {!formData.state
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
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <label className="text-sm text-gray-600">
                  <span>قوانین و مقررات </span>
                  <Link
                    href="/terms"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    AloIPNetwork
                  </Link>
                  <span> را می‌پذیرم *</span>
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="text-red-500 text-xs">{errors.agreeTerms}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال ثبت‌نام...</span>
                  </div>
                ) : (
                  "ثبت‌نام"
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                وارد شوید
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ثبت‌نام شما به معنای پذیرش{" "}
          <Link href="/terms" className="text-indigo-500 hover:underline">
            قوانین و مقررات
          </Link>{" "}
          است
        </p>
      </div>
    </div>
  );
}
