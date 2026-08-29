"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

interface Category {
  ID: number;
  id?: number;
  name: string;
  subCategory: string[];
}

interface Specialist {
  ID: number;
  UserID: number;
  Skills: string;
  Categories: Category[];
}

interface User {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role?: string;
}



const categoryColors: { [key: string]: string } = {
  firewall: "bg-red-100 text-red-800",
  "routing&switching": "bg-blue-100 text-blue-800",
  security: "bg-green-100 text-green-800",
  cloud: "bg-purple-100 text-purple-800",
  devops: "bg-pink-100 text-pink-800",
  "system admin": "bg-yellow-100 text-yellow-800",
  programming: "bg-indigo-100 text-indigo-800",
  web: "bg-teal-100 text-teal-800",
};

const skillColors: { [key: string]: string } = {
  juniper: "bg-cyan-100 text-cyan-800",
  voip: "bg-orange-100 text-orange-800",
  mpls: "bg-emerald-100 text-emerald-800",
  "network admin": "bg-slate-100 text-slate-800",
  cabling: "bg-amber-100 text-amber-800",
  sophos: "bg-lime-100 text-lime-800",
  ccna: "bg-sky-100 text-sky-800",
  ccnp: "bg-violet-100 text-violet-800",
  linux: "bg-rose-100 text-rose-800",
  docker: "bg-fuchsia-100 text-fuchsia-800",
  "windows server": "bg-gray-100 text-gray-800",
  exchange: "bg-stone-100 text-stone-800",
  python: "bg-indigo-100 text-indigo-800",
  django: "bg-teal-100 text-teal-800",
};

type ModalType = "view" | "edit" | "delete" | "create" | null;

export default function AdminSpecialistsPage() {
  const { getAccessToken } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [allSpecialists, setAllSpecialists] = useState<Specialist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedSpecialist, setSelectedSpecialist] =
    useState<Specialist | null>(null);

  // Edit states
  const [editUserId, setEditUserId] = useState<number>(0);
  const [editSkills, setEditSkills] = useState("");
  const [editCategories, setEditCategories] = useState("");

  // Create states
  const [newUserId, setNewUserId] = useState<number>(0);
  const [newSkills, setNewSkills] = useState("");
  const [newCategories, setNewCategories] = useState("");
  const [newTeam, setNewTeam] = useState<"aloOperation" | "platformSubmitted">(
    "aloOperation",
  );

  // دریافت لیست کاربران
  const fetchUsers = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data)
          ? data
          : data.data || data.users || [];
        setUsers(usersArray);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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

  // دریافت لیست متخصصان
  const fetchSpecialists = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/specialists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const specialistsArray = Array.isArray(data)
          ? data
          : data.data || data.specialists || [];

        setAllSpecialists(specialistsArray);

        // فیلتر کردن بر اساس نقش کاربر
        const hellowUserIds = users
          .filter(
            (user) => user.role === "hellow" || user.role === "specialist",
          )
          .map((user) => user.ID);

        const filteredSpecialists = specialistsArray.filter(
          (specialist: Specialist) => hellowUserIds.includes(specialist.UserID),
        );

        setSpecialists(filteredSpecialists);
      } else {
        console.error("Error fetching specialists:", response.status);
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    } finally {
      setLoading(false);
    }
  };

  // وقتی users یا allSpecialists تغییر میکنه، فیلتر رو اعمال کن
  useEffect(() => {
    if (users.length > 0 && allSpecialists.length > 0) {
      const hellowUserIds = users
        .filter((user) => user.role === "hellow" || user.role === "specialist")
        .map((user) => user.ID);

      const filtered = allSpecialists.filter((specialist) =>
        hellowUserIds.includes(specialist.UserID),
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpecialists(filtered);
    }
  }, [users, allSpecialists]);

  // ایجاد متخصص جدید
  const createSpecialist = async (specialistData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const formData = new FormData();
      formData.append("userId", String(specialistData.userId));
      formData.append("skills", specialistData.skills);
      specialistData.categoryIds.forEach((categoryId: number) => {
        formData.append("categoryIds", String(categoryId));
      });
      formData.append("team", specialistData.team);
      formData.append("skillAuthorized", "true");
      formData.append("active", "true");

      const response = await fetch(`${API_BASE_URL}/v1/specialist`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        await fetchSpecialists();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating specialist:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  // ویرایش متخصص
  const updateSpecialist = async (id: number, specialistData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/specialist/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(specialistData),
      });

      if (response.ok) {
        await fetchSpecialists();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating specialist:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  // حذف متخصص
  const deleteSpecialist = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/specialist/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchSpecialists();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting specialist:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);

  // بعد از دریافت کاربران، متخصصان رو بگیر
  useEffect(() => {
    if (users.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSpecialists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length]);

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.ID === userId);
    return user ? `${user.name} ${user.lastName}` : `کاربر ${userId}`;
  };

  const getUserRole = (userId: number) => {
    const user = users.find((u) => u.ID === userId);
    return user?.role || "نامشخص";
  };

  const filteredSpecialists = specialists.filter((specialist) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = getUserName(specialist.UserID).toLowerCase();
    const categoryNames =
      specialist.Categories?.map((cat) => cat.name.toLowerCase()).join(" ") ||
      "";
    return (
      specialist.ID.toString().includes(searchTerm) ||
      specialist.UserID.toString().includes(searchTerm) ||
      userName.includes(searchLower) ||
      specialist.Skills?.toLowerCase().includes(searchLower) ||
      categoryNames.includes(searchLower)
    );
  });

  const handleView = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setModalType("view");
  };

  const handleEdit = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setEditUserId(specialist.UserID);
    setEditSkills(specialist.Skills || "");
    const categoryNames =
      specialist.Categories?.map((cat) => cat.name).join(", ") || "";
    setEditCategories(categoryNames);
    setModalType("edit");
  };

  const handleDeleteClick = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setModalType("delete");
  };

  const handleCreate = () => {
    setNewUserId(0);
    setNewSkills("");
    setNewCategories("");
    setNewTeam("aloOperation");
    setModalType("create");
  };

  const getCategoryIds = (value: string): number[] => {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const numericId = Number(entry);
        if (Number.isInteger(numericId) && numericId > 0) return numericId;

        const category = categories.find(
          (item) => item.name.toLowerCase() === entry.toLowerCase(),
        );
        return category?.id ?? category?.ID;
      })
      .filter((categoryId): categoryId is number => categoryId !== undefined)
      .filter((categoryId, index, categoryIds) => categoryIds.indexOf(categoryId) === index);
  };

  const confirmDelete = async () => {
    if (selectedSpecialist) {
      const success = await deleteSpecialist(selectedSpecialist.ID);
      if (success) {
        closeModal();
      }
    }
  };

  const saveEdit = async () => {
    if (selectedSpecialist) {
      const success = await updateSpecialist(selectedSpecialist.ID, {
        userId: editUserId,
        skills: editSkills,
        categories: editCategories
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c),
      });
      if (success) {
        closeModal();
      }
    }
  };

  const saveNewSpecialist = async () => {
    const categoryIds = getCategoryIds(newCategories);
    if (!newUserId || !newSkills || categoryIds.length === 0) {
      alert("لطفاً تمام فیلدهای ضروری را پر کنید");
      return;
    }

    const success = await createSpecialist({
      userId: newUserId,
      skills: newSkills,
      categoryIds,
      team: newTeam,
    });

    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSpecialist(null);
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
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                👨‍🔧 لیست متخصصان هلرو
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                مدیریت و مشاهده اطلاعات متخصصان
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
              متخصص جدید
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID، User ID، نام، مهارت‌ها..."
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
              {filteredSpecialists.length} متخصص هلرو یافت شد
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            {/* Desktop Table */}
            <div className="hidden md:block h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      نام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      نقش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      مهارت‌ها
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      دسته‌بندی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSpecialists.map((specialist) => (
                    <tr key={specialist.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {specialist.ID}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {specialist.UserID}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {getUserName(specialist.UserID)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {getUserRole(specialist.UserID)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {specialist.Skills?.split(",").map((skill, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs rounded-full ${skillColors[skill.trim()] || "bg-gray-100 text-gray-700"}`}
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {specialist.Categories?.map((cat, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.name] || "bg-gray-100 text-gray-700"}`}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(specialist)}
                            className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(specialist)}
                            className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(specialist)}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
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
              {filteredSpecialists.map((specialist) => (
                <div
                  key={specialist.ID}
                  className="p-4 border-b hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">
                      ID: {specialist.ID} | User ID: {specialist.UserID}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {getUserRole(specialist.UserID)}
                    </span>
                  </div>
                  <div className="font-bold text-base mb-2">
                    {getUserName(specialist.UserID)}
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">مهارت‌ها:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {specialist.Skills?.split(",").map((skill, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-xs rounded-full ${skillColors[skill.trim()] || "bg-gray-100"}`}
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-gray-500">دسته‌بندی:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {specialist.Categories?.map((cat, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.name] || "bg-gray-100"}`}
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleView(specialist)}
                      className="flex-1 text-indigo-600 py-2 text-sm"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(specialist)}
                      className="flex-1 text-amber-600 py-2 text-sm"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(specialist)}
                      className="flex-1 text-red-600 py-2 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSpecialists.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">هیچ متخصص هلرویی یافت نشد</p>
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

      {/* View Modal - بدون تغییر */}
      {modalType === "view" && selectedSpecialist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده متخصص</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">ID</label>
                  <p>{selectedSpecialist.ID}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">User ID</label>
                  <p>{selectedSpecialist.UserID}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">نام</label>
                  <p>{getUserName(selectedSpecialist.UserID)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">نقش</label>
                  <p>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {getUserRole(selectedSpecialist.UserID)}
                    </span>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-gray-500">مهارت‌ها</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSpecialist.Skills?.split(",").map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs rounded-full ${skillColors[skill.trim()] || "bg-gray-100"}`}
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-gray-500">دسته‌بندی</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSpecialist.Categories?.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.name] || "bg-gray-100"}`}
                      >
                        {cat.name}
                      </span>
                    ))}
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

      {/* Edit Modal - بدون تغییر */}
      {modalType === "edit" && selectedSpecialist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">ویرایش متخصص</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID
                </label>
                <input
                  type="number"
                  value={editUserId}
                  onChange={(e) => setEditUserId(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  مهارت‌ها (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: juniper, voip, mpls"
                />
                <p className="text-xs text-gray-500 mt-1">
                  مهارت‌ها را با کاما از هم جدا کنید
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  دسته‌بندی (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={editCategories}
                  onChange={(e) => setEditCategories(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: firewall, routing&switching"
                />
                <p className="text-xs text-gray-500 mt-1">
                  دسته‌بندی‌ها را با کاما از هم جدا کنید
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

      {/* Create Modal - بدون تغییر */}
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
              <h2 className="text-xl font-bold">افزودن متخصص جدید</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID *
                </label>
                <input
                  type="number"
                  value={newUserId}
                  onChange={(e) => setNewUserId(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: 1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  مهارت‌ها * (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: juniper, voip, mpls"
                />
                <p className="text-xs text-gray-500 mt-1">
                  مهارت‌ها را با کاما از هم جدا کنید
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  دسته‌بندی * (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={newCategories}
                  onChange={(e) => setNewCategories(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: 1, 2 یا firewall, routing&switching"
                />
                <p className="text-xs text-gray-500 mt-1">
                  دسته‌بندی‌ها را با کاما از هم جدا کنید
                </p>
                <p className="text-xs text-red-500 mt-1">
                  فیلدهای ستاره دار (*) اجباری هستند
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  تیم *
                </label>
                <select
                  value={newTeam}
                  onChange={(e) =>
                    setNewTeam(
                      e.target.value as "aloOperation" | "platformSubmitted",
                    )
                  }
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="aloOperation">aloOperation</option>
                  <option value="platformSubmitted">platformSubmitted</option>
                </select>
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
                onClick={saveNewSpecialist}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal - بدون تغییر */}
      {modalType === "delete" && selectedSpecialist && (
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
              <h3 className="text-lg font-bold text-center mb-2">حذف متخصص</h3>
              <p className="text-gray-600 text-center mb-6">
                آیا از حذف متخصص &quot;{getUserName(selectedSpecialist.UserID)}
                &quot; مطمئن هستید؟
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
