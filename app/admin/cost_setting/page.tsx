"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createCostSetting,
  deleteCostSetting,
  fetchCostSettings,
  updateCostSetting,
  type CostSettingRecord,
} from "../../lib/api/admin-cost-settings";

type CostSetting = CostSettingRecord;

const planLabels: { [key: string]: string } = {
  instant: "فوری",
  shortStay: "کوتاه‌مدت",
  schedulable: "زمان‌بندی شده",
  inPerson: "حضوری",
  platformPublished: "پلتفرم",
};

const planOptions = [
  { value: "instant", label: "فوری" },
  { value: "shortStay", label: "کوتاه‌مدت" },
  { value: "schedulable", label: "زمان‌بندی شده" },
  { value: "inPerson", label: "حضوری" },
  { value: "platformPublished", label: "پلتفرم" },
];

type ModalType = "edit" | "delete" | "create" | null;

export default function AdminCostSettingsPage() {
  const { getAccessToken } = useAuth();
  const [costSettings, setCostSettings] = useState<CostSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedSetting, setSelectedSetting] = useState<CostSetting | null>(
    null,
  );

  // Form states
  const [formData, setFormData] = useState({
    plan: "instant",
    costPerHour: "",
  });

  // دریافت لیست تنظیمات هزینه
  const loadCostSettings = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const settingsArray = await fetchCostSettings(token);
      setCostSettings(settingsArray);
    } catch (error) {
      console.error("Error fetching cost settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // ایجاد تنظیمات هزینه جدید
  const createSetting = async (settingData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const result = await createCostSetting(token, {
        Plan: settingData.plan,
        CostPerHour: settingData.costPerHour,
        FixedPrice: null,
      });

      if (result.ok) {
        await loadCostSettings();
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating cost setting:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  // ویرایش تنظیمات هزینه
  const updateSetting = async (id: number, settingData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const result = await updateCostSetting(token, id, {
        Plan: settingData.plan,
        CostPerHour: settingData.costPerHour,
        FixedPrice: null,
      });

      if (result.ok) {
        await loadCostSettings();
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating cost setting:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  // حذف تنظیمات هزینه
  const removeSetting = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const result = await deleteCostSetting(token, id);

      if (result.ok) {
        await loadCostSettings();
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting cost setting:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    void loadCostSettings();
  }, []);

  const formatAmount = (amount: number | null | undefined): string => {
    const safeAmount = typeof amount === "number" ? amount : 0;
    if (!safeAmount && safeAmount !== 0) return "۰";
    return new Intl.NumberFormat("fa-IR").format(safeAmount);
  };

  const normalizeDigits = (value: string): string => {
    return value
      .replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
      .replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)))
      .replace(/[^0-9]/g, "");
  };

  const parseAmount = (amountStr: string): number => {
    const normalized = normalizeDigits(amountStr);
    return Number(normalized) || 0;
  };

  const filteredSettings = costSettings.filter((setting) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      setting.ID.toString().includes(searchTerm) ||
      planLabels[setting.Plan]?.toLowerCase().includes(searchLower) ||
      setting.Plan?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (setting: CostSetting) => {
    setSelectedSetting(setting);
    setFormData({
      plan: setting.Plan,
      costPerHour: formatAmount(setting.CostPerHour),
    });
    setModalType("edit");
  };

  const handleDeleteClick = (setting: CostSetting) => {
    setSelectedSetting(setting);
    setModalType("delete");
  };

  const handleCreate = () => {
    setFormData({
      plan: "instant",
      costPerHour: "",
    });
    setModalType("create");
  };

  const confirmDelete = async () => {
    if (selectedSetting) {
      const success = await removeSetting(selectedSetting.ID);
      if (success) {
        closeModal();
      }
    }
  };

  const saveEdit = async () => {
    if (selectedSetting && formData.plan && formData.costPerHour) {
      const newCost = parseAmount(formData.costPerHour);
      const success = await updateSetting(selectedSetting.ID, {
        plan: formData.plan,
        costPerHour: newCost,
      });
      if (success) {
        closeModal();
      }
    } else {
      alert("لطفاً تمام فیلدها را پر کنید");
    }
  };

  const saveNewSetting = async () => {
    if (!formData.plan || !formData.costPerHour) {
      alert("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    const newCost = parseAmount(formData.costPerHour);
    const success = await createSetting({
      plan: formData.plan,
      costPerHour: newCost,
    });

    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSetting(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
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
    <div className="flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                💰 تنظیمات هزینه
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                مدیریت هزینه هر ساعت برای پلن‌های مختلف
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
              افزودن
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID یا نام پلن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              {toPersianNumber(filteredSettings.length)} مورد یافت شد
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      پلن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      هزینه هر ساعت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSettings.map((setting) => (
                    <tr
                      key={setting.ID}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {setting.ID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {planLabels[setting.Plan] || setting.Plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(setting.CostPerHour)} تومان
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(setting)}
                            className="text-amber-600 hover:text-amber-900 px-3 py-1 rounded-md hover:bg-amber-50"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(setting)}
                            className="text-red-600 hover:text-red-900 px-3 py-1 rounded-md hover:bg-red-50"
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

            {/* Mobile Cards */}
            <div className="md:hidden">
              {filteredSettings.map((setting) => (
                <div key={setting.ID} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">
                      ID: {setting.ID}
                    </span>
                  </div>
                  <div className="font-bold text-base mb-1">
                    {planLabels[setting.Plan] || setting.Plan}
                  </div>
                  <div className="text-sm text-green-600 font-semibold mb-3">
                    {formatAmount(setting.CostPerHour)} تومان
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleEdit(setting)}
                      className="flex-1 text-amber-600 py-2 text-sm"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(setting)}
                      className="flex-1 text-red-600 py-2 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSettings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">نتیجه‌ای یافت نشد</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg"
                >
                  حذف فیلترها
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {modalType === "create" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">افزودن هزینه جدید</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  پلن *
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({ ...formData, plan: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {planOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  هزینه هر ساعت (تومان) *
                </label>
                <input
                  type="text"
                  value={formData.costPerHour}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const digitsOnly = normalizeDigits(rawValue);
                    const formattedValue =
                      digitsOnly === "" ? "" : new Intl.NumberFormat("fa-IR").format(Number(digitsOnly));
                    setFormData({ ...formData, costPerHour: formattedValue });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: ۱,۰۰۰,۰۰۰"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  فیلدهای ستاره دار (*) اجباری هستند
                </p>
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
                onClick={saveNewSetting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedSetting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">ویرایش هزینه</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  پلن
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({ ...formData, plan: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {planOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  هزینه هر ساعت (تومان)
                </label>
                <input
                  type="text"
                  value={formData.costPerHour}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const digitsOnly = normalizeDigits(rawValue);
                    const formattedValue =
                      digitsOnly === "" ? "" : new Intl.NumberFormat("fa-IR").format(Number(digitsOnly));
                    setFormData({ ...formData, costPerHour: formattedValue });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: ۱,۰۰۰,۰۰۰"
                  autoFocus
                />
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
                onClick={saveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedSetting && (
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
              <h3 className="text-lg font-bold text-center mb-2">حذف هزینه</h3>
              <p className="text-gray-600 text-center mb-6">
                آیا از حذف هزینه پلن{planLabels[selectedSetting.Plan]} مطمئن
                هستید؟
                <br />
                <span className="text-sm text-red-500">
                  این عمل قابل بازگشت نیست.
                </span>
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
