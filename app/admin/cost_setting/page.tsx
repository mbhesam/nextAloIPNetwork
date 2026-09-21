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

  const [formData, setFormData] = useState({
    plan: "instant",
    costPerHour: "",
  });

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
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                💰 تنظیمات هزینه
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت هزینه هر ساعت برای پلن‌های مختلف
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
              افزودن
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID یا نام پلن..."
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
              {toPersianNumber(filteredSettings.length)} مورد یافت شد
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      پلن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      هزینه هر ساعت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSettings.map((setting) => (
                    <tr
                      key={setting.ID}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {setting.ID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">
                        {planLabels[setting.Plan] || setting.Plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-300">
                        {formatAmount(setting.CostPerHour)} تومان
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(setting)}
                            className="text-green-300 hover:text-green-200 px-3 py-1 rounded-md transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(setting)}
                            className="text-red-300 hover:text-red-200 px-3 py-1 rounded-md transition"
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
                <div
                  key={setting.ID}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white/40">
                      ID: {setting.ID}
                    </span>
                  </div>
                  <div className="font-bold text-base text-white/90 mb-1">
                    {planLabels[setting.Plan] || setting.Plan}
                  </div>
                  <div className="text-sm text-green-300 font-semibold mb-3">
                    {formatAmount(setting.CostPerHour)} تومان
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(setting)}
                      className="flex-1 text-green-300 py-2 text-sm  rounded transition"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(setting)}
                      className="flex-1 text-red-300 py-2 text-sm rounded transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSettings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">نتیجه‌ای یافت نشد</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-blue-300 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                افزودن هزینه جدید
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
                <label className="block text-sm font-medium text-white/70 mb-2">
                  پلن *
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({ ...formData, plan: e.target.value })
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
                  {planOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  هزینه هر ساعت (تومان) *
                </label>
                <input
                  type="text"
                  value={formData.costPerHour}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const digitsOnly = normalizeDigits(rawValue);
                    const formattedValue =
                      digitsOnly === ""
                        ? ""
                        : new Intl.NumberFormat("fa-IR").format(
                            Number(digitsOnly),
                          );
                    setFormData({ ...formData, costPerHour: formattedValue });
                  }}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: ۱,۰۰۰,۰۰۰"
                  autoFocus
                />
                <p className="text-xs text-red-300/80 mt-1">
                  فیلدهای ستاره دار (*) اجباری هستند
                </p>
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
                onClick={saveNewSetting}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">ویرایش هزینه</h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  پلن
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({ ...formData, plan: e.target.value })
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
                  {planOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  هزینه هر ساعت (تومان)
                </label>
                <input
                  type="text"
                  value={formData.costPerHour}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const digitsOnly = normalizeDigits(rawValue);
                    const formattedValue =
                      digitsOnly === ""
                        ? ""
                        : new Intl.NumberFormat("fa-IR").format(
                            Number(digitsOnly),
                          );
                    setFormData({ ...formData, costPerHour: formattedValue });
                  }}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: ۱,۰۰۰,۰۰۰"
                  autoFocus
                />
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
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
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
                حذف هزینه
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف هزینه پلن {planLabels[selectedSetting.Plan]} مطمئن
                هستید؟
                <br />
                <span className="text-sm text-red-300">
                  این عمل قابل بازگشت نیست.
                </span>
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
