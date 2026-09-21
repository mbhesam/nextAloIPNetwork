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
  firewall: "bg-red-500/20 text-red-200",
  "routing&switching": "bg-blue-500/20 text-blue-200",
  security: "bg-green-500/20 text-green-200",
  cloud: "bg-purple-500/20 text-purple-200",
  devops: "bg-pink-500/20 text-pink-200",
  "system admin": "bg-yellow-500/20 text-yellow-200",
  programming: "bg-indigo-500/20 text-indigo-200",
  web: "bg-teal-500/20 text-teal-200",
};

const skillColors: { [key: string]: string } = {
  juniper: "bg-cyan-500/20 text-cyan-200",
  voip: "bg-orange-500/20 text-orange-200",
  mpls: "bg-emerald-500/20 text-emerald-200",
  "network admin": "bg-slate-500/20 text-slate-200",
  cabling: "bg-amber-500/20 text-amber-200",
  sophos: "bg-lime-500/20 text-lime-200",
  ccna: "bg-sky-500/20 text-sky-200",
  ccnp: "bg-violet-500/20 text-violet-200",
  linux: "bg-rose-500/20 text-rose-200",
  docker: "bg-fuchsia-500/20 text-fuchsia-200",
  "windows server": "bg-gray-500/20 text-gray-200",
  exchange: "bg-stone-500/20 text-stone-200",
  python: "bg-indigo-500/20 text-indigo-200",
  django: "bg-teal-500/20 text-teal-200",
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

  const [editUserId, setEditUserId] = useState<number>(0);
  const [editSkills, setEditSkills] = useState("");
  const [editCategories, setEditCategories] = useState("");

  const [newUserId, setNewUserId] = useState<number>(0);
  const [newSkills, setNewSkills] = useState("");
  const [newCategories, setNewCategories] = useState("");
  const [newTeam, setNewTeam] = useState<"aloOperation" | "platformSubmitted">(
    "aloOperation",
  );

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
        // نمایش همه متخصصان بدون فیلتر
        setSpecialists(specialistsArray);
      } else {
        console.error("Error fetching specialists:", response.status);
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    } finally {
      setLoading(false);
    }
  };

  // حذف useEffect فیلتر

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
      formData.append(
        "specialistTeam",
        specialistData.specialistTeam ?? specialistData.team ?? "aloOperation",
      );
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

  useEffect(() => {
    if (users.length > 0) {
      fetchSpecialists();
    }
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
      .filter(
        (categoryId, index, categoryIds) =>
          categoryIds.indexOf(categoryId) === index,
      );
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
      specialistTeam: newTeam,
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
      <div className="flex items-center justify-center min-h-screen">
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

      <div className="relative z-10 container mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                👨‍🔧 لیست متخصصان
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت و مشاهده اطلاعات متخصصان
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
              متخصص جدید
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
                  placeholder="جستجو بر اساس ID، User ID، نام، مهارت‌ها..."
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
              {filteredSpecialists.length} متخصص یافت شد
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            {/* Desktop Table */}
            <div className="hidden md:block h-full">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      نام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      نقش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      مهارت‌ها
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      دسته‌بندی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSpecialists.map((specialist) => (
                    <tr
                      key={specialist.ID}
                      className="hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4 text-sm text-white/80">
                        {specialist.ID}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        {specialist.UserID}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white/90">
                        {getUserName(specialist.UserID)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-white border border-green-400/20">
                          {getUserRole(specialist.UserID)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {specialist.Skills?.split(",").map((skill, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs rounded-full ${skillColors[skill.trim()] || "bg-white/10 text-white/60"}`}
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {specialist.Categories?.map((cat, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.name] || "bg-white/10 text-white/60"}`}
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
                            className="text-blue-300 hover:text-blue-200 px-2 py-1 rounded  transition"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(specialist)}
                            className="text-green-300 hover:text-green-200 px-2 py-1 rounded  transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(specialist)}
                            className="text-red-300 hover:text-red-200 px-2 py-1 rounded  transition"
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
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white/40">
                      ID: {specialist.ID} | User ID: {specialist.UserID}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-200 border border-green-400/20">
                      {getUserRole(specialist.UserID)}
                    </span>
                  </div>
                  <div className="font-bold text-base text-white/90 mb-2">
                    {getUserName(specialist.UserID)}
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-white/40">مهارت‌ها:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {specialist.Skills?.split(",").map((skill, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-xs rounded-full ${skillColors[skill.trim()] || "bg-white/10 text-white/60"}`}
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-white/40">دسته‌بندی:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {specialist.Categories?.map((cat, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.name] || "bg-white/10 text-white/60"}`}
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(specialist)}
                      className="flex-1 text-blue-300 py-2 text-sm hover:bg-blue-500/10 rounded transition"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(specialist)}
                      className="flex-1 text-amber-300 py-2 text-sm hover:bg-amber-500/10 rounded transition"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(specialist)}
                      className="flex-1 text-red-300 py-2 text-sm hover:bg-red-500/10 rounded transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSpecialists.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">هیچ متخصصی یافت نشد</p>
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
      {modalType === "view" && selectedSpecialist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">مشاهده متخصص</h2>
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
                  <p className="text-white/80">{selectedSpecialist.ID}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">User ID</label>
                  <p className="text-white/80">{selectedSpecialist.UserID}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">نام</label>
                  <p className="text-white/80">
                    {getUserName(selectedSpecialist.UserID)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">نقش</label>
                  <p>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-200 border border-green-400/20">
                      {getUserRole(selectedSpecialist.UserID)}
                    </span>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-white/50">مهارت‌ها</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSpecialist.Skills?.split(",").map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs rounded-full ${skillColors[skill.trim()] || "bg-white/10 text-white/60"}`}
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-white/50">دسته‌بندی</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSpecialist.Categories?.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.name] || "bg-white/10 text-white/60"}`}
                      >
                        {cat.name}
                      </span>
                    ))}
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
      {modalType === "edit" && selectedSpecialist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">ویرایش متخصص</h2>
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
                  User ID
                </label>
                <input
                  type="number"
                  value={editUserId}
                  onChange={(e) => setEditUserId(parseInt(e.target.value))}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  مهارت‌ها (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: juniper, voip, mpls"
                />
                <p className="text-xs text-white/40 mt-1">
                  مهارت‌ها را با کاما از هم جدا کنید
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  دسته‌بندی (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={editCategories}
                  onChange={(e) => setEditCategories(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: firewall, routing&switching"
                />
                <p className="text-xs text-white/40 mt-1">
                  دسته‌بندی‌ها را با کاما از هم جدا کنید
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
                افزودن متخصص جدید
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
                  User ID *
                </label>
                <input
                  type="number"
                  value={newUserId}
                  onChange={(e) => setNewUserId(parseInt(e.target.value))}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: 1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  مهارت‌ها * (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: juniper, voip, mpls"
                />
                <p className="text-xs text-white/40 mt-1">
                  مهارت‌ها را با کاما از هم جدا کنید
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  دسته‌بندی * (با کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={newCategories}
                  onChange={(e) => setNewCategories(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="مثال: 1, 2 یا firewall, routing&switching"
                />
                <p className="text-xs text-white/40 mt-1">
                  دسته‌بندی‌ها را با کاما از هم جدا کنید
                </p>
                <p className="text-xs text-red-300/80 mt-1">
                  فیلدهای ستاره دار (*) اجباری هستند
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  تیم *
                </label>
                <select
                  value={newTeam}
                  onChange={(e) =>
                    setNewTeam(
                      e.target.value as "aloOperation" | "platformSubmitted",
                    )
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
                    value="aloOperation"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    aloOperation
                  </option>
                  <option
                    value="platformSubmitted"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    platformSubmitted
                  </option>
                </select>
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
                onClick={saveNewSpecialist}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedSpecialist && (
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
                حذف متخصص
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف متخصص &quot;{getUserName(selectedSpecialist.UserID)}
                &quot; مطمئن هستید؟
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
