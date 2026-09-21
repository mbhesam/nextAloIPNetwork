"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryRecord,
} from "../../lib/api/admin-categories";

type Category = CategoryRecord;

type ModalType = "view" | "edit" | "delete" | "create" | null;

export default function AdminCategoriesPage() {
  const { getAccessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [editName, setEditName] = useState("");
  const [editSubCategories, setEditSubCategories] = useState("");
  const [newName, setNewName] = useState("");
  const [newSubCategories, setNewSubCategories] = useState("");

  const loadCategories = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const normalizedCategories = await fetchCategories(token);
      setCategories(normalizedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCategoryRecord = async (categoryData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const result = await createCategory(token, {
        name: categoryData.name,
        subCategory: categoryData.subCategory,
      });

      if (result.ok) {
        await loadCategories();
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const updateCategoryRecord = async (id: number, categoryData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const result = await updateCategory(token, id, {
        name: categoryData.name,
        subCategory: categoryData.subCategory,
      });

      if (result.ok) {
        await loadCategories();
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const deleteCategoryRecord = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const result = await deleteCategory(token, id);

      if (result.ok) {
        await loadCategories();
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const searchLower = searchTerm.toLowerCase();
    const subCategoryNames = category.subCategory?.join(" ") || "";
    return (
      category.id.toString().includes(searchTerm) ||
      category.name.toLowerCase().includes(searchLower) ||
      subCategoryNames.toLowerCase().includes(searchLower)
    );
  });

  const handleView = (category: Category) => {
    setSelectedCategory(category);
    setModalType("view");
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditName(category.name);
    const subNames = category.subCategory?.join(", ") || "";
    setEditSubCategories(subNames);
    setModalType("edit");
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setModalType("delete");
  };

  const handleCreate = () => {
    setNewName("");
    setNewSubCategories("");
    setModalType("create");
  };

  const confirmDelete = async () => {
    if (selectedCategory) {
      const success = await deleteCategoryRecord(selectedCategory.id);
      if (success) {
        closeModal();
      }
    }
  };

  const saveEdit = async () => {
    if (selectedCategory) {
      const subArray = editSubCategories
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      const success = await updateCategoryRecord(selectedCategory.id, {
        name: editName,
        subCategory: subArray,
      });
      if (success) {
        closeModal();
      }
    }
  };

  const saveNewCategory = async () => {
    if (!newName) {
      alert("لطفاً نام دسته‌بندی را وارد کنید");
      return;
    }

    const subArray = newSubCategories
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    const success = await createCategoryRecord({
      name: newName,
      subCategory: subArray,
    });

    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCategory(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 relative overflow-hidden">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 container mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                📂 دسته‌بندی‌ها
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت و مشاهده دسته‌بندی‌ها و زیرمجموعه‌ها
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0"
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
              دسته‌بندی جدید
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
                  placeholder="جستجو بر اساس نام دسته‌بندی یا زیرمجموعه‌ها..."
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
              {filteredCategories.length} دسته‌بندی یافت شد
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
                      نام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      زیرمجموعه‌ها
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {category.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        <div className="flex flex-wrap gap-1">
                          {category.subCategory &&
                          category.subCategory.length > 0 ? (
                            category.subCategory.map((sub, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-white border border-blue-400/20"
                              >
                                {sub}
                              </span>
                            ))
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(category)}
                            className="text-blue-300 hover:text-blue-200 px-3 py-1 rounded-md  transition"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-green-300 hover:text-green-200 px-3 py-1 rounded-md transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
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
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-white/40">ID: </span>
                      <span className="text-sm font-medium text-white/80">
                        {category.id}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-base text-white/90 mb-2">
                    {category.name}
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-white/40 block mb-1">
                      زیرمجموعه‌ها
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {category.subCategory &&
                      category.subCategory.length > 0 ? (
                        category.subCategory.map((sub, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20"
                          >
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(category)}
                      className="flex-1 text-blue-300 py-2 text-sm rounded transition"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 text-amber-300 py-2 text-sm rounded transition"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="flex-1 text-red-300 py-2 text-sm rounded transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCategories.length === 0 && (
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

      {/* View Modal */}
      {modalType === "view" && selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                مشاهده دسته‌بندی
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/50">ID</label>
                  <p className="text-white/80">{selectedCategory.id}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">نام</label>
                  <p className="text-white/80">{selectedCategory.name}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-white/50">زیرمجموعه‌ها</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCategory.subCategory &&
                    selectedCategory.subCategory.length > 0 ? (
                      selectedCategory.subCategory.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-white border border-blue-400/20"
                        >
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                ویرایش دسته‌بندی
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
                  نام دسته‌بندی
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  زیرمجموعه‌ها (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={editSubCategories}
                  onChange={(e) => setEditSubCategories(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: cisco, huawei, juniper"
                />
                <p className="text-xs text-white/40 mt-1">
                  زیرمجموعه‌ها را با کاما از هم جدا کنید
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
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalType === "create" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                افزودن دسته‌بندی جدید
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
                  نام دسته‌بندی *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: firewall"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  زیرمجموعه‌ها (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={newSubCategories}
                  onChange={(e) => setNewSubCategories(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: fortigate, sophos, pfsense"
                />
                <p className="text-xs text-white/40 mt-1">
                  زیرمجموعه‌ها را با کاما از هم جدا کنید
                </p>
                <p className="text-xs text-red-500  mt-1">
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
                onClick={saveNewCategory}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedCategory && (
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
                حذف دسته‌بندی
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف دسته‌بندی "{selectedCategory.name}" مطمئن هستید؟
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
