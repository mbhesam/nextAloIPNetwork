"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

interface Category {
  id: number;
  name: string;
  subCategory: string[]; // تغییر: آرایه از رشته‌ها
}



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

  const fetchCategories = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("داده دریافتی از سرور:", data);

        let categoriesArray = [];
        if (Array.isArray(data)) {
          categoriesArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          categoriesArray = data.data;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoriesArray = data.categories;
        } else {
          categoriesArray = [];
        }

        // نرمال‌سازی بر اساس ساختار واقعی بک‌اند
        const normalizedCategories = categoriesArray.map((cat: any) => ({
          id: cat.id || cat.ID || 0,
          name: cat.name || cat.Name || "",
          subCategory: cat.subCategory || cat.SubCategory || [],
        }));

        console.log("دسته‌بندی‌های نرمال شده:", normalizedCategories);
        setCategories(normalizedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/category`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryData.name,
          subCategory: categoryData.subCategory,
        }),
      });

      if (response.ok) {
        await fetchCategories();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const updateCategory = async (id: number, categoryData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/category/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryData.name,
          subCategory: categoryData.subCategory,
        }),
      });

      if (response.ok) {
        await fetchCategories();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const deleteCategory = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/category/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchCategories();
        return true;
      } else {
        const error = await response.text();
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
    fetchCategories();
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
      const success = await deleteCategory(selectedCategory.id);
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
      const success = await updateCategory(selectedCategory.id, {
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
    const success = await createCategory({
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                📂 دسته‌بندی‌ها
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                مدیریت و مشاهده دسته‌بندی‌ها و زیرمجموعه‌ها
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0"
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
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام دسته‌بندی یا زیرمجموعه‌ها..."
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
              {filteredCategories.length} دسته‌بندی یافت شد
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
                      نام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      زیرمجموعه‌ها
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {category.subCategory &&
                          category.subCategory.length > 0 ? (
                            category.subCategory.map((sub, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {sub}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(category)}
                            className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md hover:bg-indigo-50"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-amber-600 hover:text-amber-900 px-3 py-1 rounded-md hover:bg-amber-50"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
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
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border-b hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-gray-500">ID: </span>
                      <span className="text-sm font-medium">{category.id}</span>
                    </div>
                  </div>
                  <div className="font-bold text-base mb-2">
                    {category.name}
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 block mb-1">
                      زیرمجموعه‌ها
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {category.subCategory &&
                      category.subCategory.length > 0 ? (
                        category.subCategory.map((sub, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                          >
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleView(category)}
                      className="flex-1 text-indigo-600 py-2 text-sm"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 text-amber-600 py-2 text-sm"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="flex-1 text-red-600 py-2 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCategories.length === 0 && (
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

      {/* View Modal */}
      {modalType === "view" && selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده دسته‌بندی</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">ID</label>
                  <p>{selectedCategory.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">نام</label>
                  <p>{selectedCategory.name}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-gray-500">زیرمجموعه‌ها</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCategory.subCategory &&
                    selectedCategory.subCategory.length > 0 ? (
                      selectedCategory.subCategory.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                        >
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">ویرایش دسته‌بندی</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  نام دسته‌بندی
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  زیرمجموعه‌ها (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={editSubCategories}
                  onChange={(e) => setEditSubCategories(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: cisco, huawei, juniper"
                />
                <p className="text-xs text-gray-500 mt-1">
                  زیرمجموعه‌ها را با کاما از هم جدا کنید
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3">
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

      {/* Create Modal */}
      {modalType === "create" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">افزودن دسته‌بندی جدید</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  نام دسته‌بندی *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: firewall"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  زیرمجموعه‌ها (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={newSubCategories}
                  onChange={(e) => setNewSubCategories(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: fortigate, sophos, pfsense"
                />
                <p className="text-xs text-gray-500 mt-1">
                  زیرمجموعه‌ها را با کاما از هم جدا کنید
                </p>
                <p className="text-xs text-red-500 mt-1">
                  فیلدهای ستاره دار (*) اجباری هستند
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={saveNewCategory}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
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
              <h3 className="text-lg font-bold text-center mb-2">
                حذف دسته‌بندی
              </h3>
              <p className="text-gray-600 text-center mb-6">
                آیا از حذف دسته‌بندی "{selectedCategory.name}" مطمئن هستید؟
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
