"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  fetchCities,
  fetchStates,
  updateAdminUser,
  type AdminUserRecord,
  type UserRole,
} from "../../lib/api/admin-users";

type User = AdminUserRecord;

const roleColors = {
  admin: "bg-purple-500/20 text-white",
  specialist: "bg-blue-500/20 text-white",
  customer: "bg-green-500/20 text-white",
};

const roleLabels = {
  admin: "ادمین",
  specialist: "متخصص",
  customer: "مشتری",
};

const roleOptions = [
  { value: "all", label: "همه نقش‌ها" },
  { value: "admin", label: "ادمین" },
  { value: "specialist", label: "متخصص" },
  { value: "customer", label: "مشتری" },
];

type Role = UserRole;
type ModalType = "view" | "edit" | "delete" | "create" | null;

export default function AdminUsersPage() {
  const { getAccessToken } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("customer");
  const [editBudget, setEditBudget] = useState("");

  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");

  const [newName, setNewName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("customer");
  const [newBudget, setNewBudget] = useState("");
  const [newMelliCode, setNewMelliCode] = useState("");

  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [editCities, setEditCities] = useState<string[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingEditCities, setLoadingEditCities] = useState(false);

  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat("fa-IR").format(budget) + " تومان";
  };

  const convertPersianNumbersToEnglish = (value: string) => {
    return value.replace(/[۰-۹]/g, (digit) => {
      return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
    });
  };

  const parseBudget = (budgetStr: string) => {
    const englishNumber = convertPersianNumbersToEnglish(budgetStr);
    const cleanNumber = englishNumber.replace(/[^0-9]/g, "");
    return parseInt(cleanNumber, 10) || 0;
  };

  const loadStates = async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoadingStates(true);
    try {
      const data = await fetchStates(token);
      setStates(data);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const loadCities = async (state: string, mode: "create" | "edit") => {
    const token = getAccessToken();
    if (!token || !state) {
      if (mode === "create") {
        setCities([]);
      } else {
        setEditCities([]);
      }
      return;
    }

    if (mode === "create") {
      setLoadingCities(true);
    } else {
      setLoadingEditCities(true);
    }

    try {
      const data = await fetchCities(token, state);
      if (mode === "create") {
        setCities(data);
      } else {
        setEditCities(data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      if (mode === "create") {
        setCities([]);
      } else {
        setEditCities([]);
      }
    } finally {
      if (mode === "create") {
        setLoadingCities(false);
      } else {
        setLoadingEditCities(false);
      }
    }
  };

  const loadUsers = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const usersArray = await fetchAdminUsers(token);
      setUsers(usersArray);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    name: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    password: string;
    role: Role;
    budget: number;
    melliCode: string;
    city: string;
    state: string;
    type: string;
  }) => {
    const token = getAccessToken();
    if (!token) {
      alert("توکن ورود پیدا نشد");
      return false;
    }

    setSavingUser(true);
    try {
      const result = await createAdminUser(token, userData);
      if (result.ok) {
        await loadUsers();
        return true;
      }
      alert(`❌ خطا در ایجاد کاربر:\n${result.responseText}`);
      return false;
    } catch (error) {
      console.error("Error creating user:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const updateUser = async (
    id: number,
    userData: {
      name: string;
      lastName: string;
      phoneNumber: string;
      email: string;
      role: Role;
      budget: number;
      melliCode: string;
      city: string;
      state: string;
      type: string;
    },
  ) => {
    const token = getAccessToken();
    if (!token) {
      alert("توکن ورود پیدا نشد");
      return false;
    }

    setSavingUser(true);
    try {
      const result = await updateAdminUser(token, id, userData);
      if (result.ok) {
        await loadUsers();
        return true;
      }
      alert(`❌ خطا در ویرایش کاربر:\n${result.responseText}`);
      return false;
    } catch (error) {
      console.error("Error updating user:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (id: number) => {
    const token = getAccessToken();
    if (!token) {
      alert("توکن ورود پیدا نشد");
      return false;
    }

    setDeletingUser(true);
    try {
      const result = await deleteAdminUser(token, id);
      if (result.ok) {
        await loadUsers();
        return true;
      }
      alert(`❌ خطا در حذف کاربر:\n${result.responseText}`);
      return false;
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    } finally {
      setDeletingUser(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadStates();
  }, []);

  const handleNewStateChange = async (state: string) => {
    setNewState(state);
    setNewCity("");
    if (!state) {
      setCities([]);
      return;
    }
    await loadCities(state, "create");
  };

  const handleEditStateChange = async (state: string) => {
    setEditState(state);
    setEditCity("");
    if (!state) {
      setEditCities([]);
      return;
    }
    await loadCities(state, "edit");
  };

  const filteredUsers = users.filter((user) => {
    if (selectedRole !== "all" && user.role !== selectedRole) {
      return false;
    }
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.ID?.toString().includes(searchTerm) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.phoneNumber?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleView = (user: User) => {
    setSelectedUser(user);
    setModalType("view");
  };

  const handleEdit = async (user: User) => {
    setSelectedUser(user);
    setEditName(user.name || "");
    setEditLastName(user.lastName || "");
    setEditPhone(user.phoneNumber || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "customer");
    setEditBudget(String(user.budget ?? 0));
    setEditState(user.state || "");
    setEditCity(user.city || "");
    setEditCities([]);
    if (user.state) {
      await loadCities(user.state, "edit");
    }
    setModalType("edit");
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  const handleCreate = () => {
    setNewName("");
    setNewLastName("");
    setNewPhone("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("customer");
    setNewBudget("");
    setNewMelliCode("");
    setNewState("");
    setNewCity("");
    setCities([]);
    setModalType("create");
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    const success = await deleteUser(selectedUser.ID);
    if (success) {
      closeModal();
    }
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    if (!editName.trim()) {
      alert("نام را وارد کنید");
      return;
    }
    if (!editPhone.trim()) {
      alert("شماره تلفن را وارد کنید");
      return;
    }
    if (!editEmail.trim()) {
      alert("ایمیل را وارد کنید");
      return;
    }
    if (!editState) {
      alert("استان را انتخاب کنید");
      return;
    }
    if (!editCity) {
      alert("شهر را انتخاب کنید");
      return;
    }

    const success = await updateUser(selectedUser.ID, {
      name: editName,
      lastName: editLastName,
      phoneNumber: editPhone,
      email: editEmail,
      role: editRole,
      budget: parseBudget(editBudget),
      melliCode: selectedUser.melliCode || "",
      city: editCity,
      state: editState,
      type: selectedUser.type || "national",
    });

    if (success) {
      closeModal();
    }
  };

  const saveNewUser = async () => {
    if (
      !newName.trim() ||
      !newPhone.trim() ||
      !newEmail.trim() ||
      !newPassword.trim()
    ) {
      alert("لطفاً تمام فیلدهای ضروری (نام، تلفن، ایمیل، رمز عبور) را پر کنید");
      return;
    }
    if (newPassword.length < 6) {
      alert("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (!newState) {
      alert("لطفاً استان را انتخاب کنید");
      return;
    }
    if (!newCity) {
      alert("لطفاً شهر را انتخاب کنید");
      return;
    }

    const userData = {
      name: newName.trim(),
      lastName: newLastName.trim(),
      phoneNumber: newPhone.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole,
      budget: parseBudget(newBudget),
      melliCode: newMelliCode.trim(),
      city: newCity,
      state: newState,
      type: "national",
    };

    const success = await createUser(userData);
    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen  p-4 md:p-6 relative overflow-hidden"
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

      <div className="relative z-10 container mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="mt-30 px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                👥 مدیریت کاربران
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مشاهده و مدیریت تمام کاربران سیستم
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
              کاربر جدید
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، تلفن، ایمیل یا ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>
              <div className="sm:w-64">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  فیلتر نقش
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
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
                  {roleOptions.map((option) => (
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
              {filteredUsers.length} کاربر یافت شد
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            {/* Desktop */}
            <div className="hidden md:block h-full">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      شناسه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      نام و نام خانوادگی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      تلفن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      ایمیل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      نقش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      بودجه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.ID} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {user.ID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">
                        {user.name || "—"} {user.lastName || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {user.phoneNumber || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {user.email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-300">
                        {formatBudget(user.budget || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(user)}
                            className="text-white  px-3 py-1 rounded-md hover:bg-blue-500/10 transition"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-emerald-500  hover:text-amber-200 px-3 py-1 rounded-md  transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-300 hover:text-red-200 px-3 py-1 rounded-md  transition"
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

            {/* Mobile */}
            <div className="md:hidden">
              {filteredUsers.map((user) => (
                <div
                  key={user.ID}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs text-white/40">شناسه:</span>
                      <span className="text-sm font-medium mr-1 text-white/80">
                        {user.ID}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="text-base font-bold text-white/90">
                      {user.name || "—"} {user.lastName || ""}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm text-white/60">
                    <div>
                      <span className="text-xs text-white/40 block">تلفن</span>
                      <span>{user.phoneNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-white/40 block">ایمیل</span>
                      <span className="break-all">{user.email || "—"}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-xs text-white/40 block">بودجه</span>
                    <span className="text-base font-semibold text-green-300">
                      {formatBudget(user.budget || 0)}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(user)}
                      className="flex-1 text-white px-3 py-2 rounded-md hover:bg-blue-500/10 text-sm font-medium transition"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 text-amber-300 px-3 py-2 rounded-md hover:bg-amber-500/10 text-sm font-medium transition"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="flex-1 text-red-300 px-3 py-2 rounded-md hover:bg-red-500/10 text-sm font-medium transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">نتیجه‌ای یافت نشد</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-blue-200  rounded-lg hover:bg-blue-500/20 transition"
                >
                  حذف فیلترها
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          View Modal
      ========================= */}
      {modalType === "view" && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">مشاهده کاربر</h2>
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
                  <label className="block text-sm text-white/50">شناسه</label>
                  <p className="mt-1 text-white/80">{selectedUser.ID}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">نقش</label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${roleColors[selectedUser.role]}`}
                    >
                      {roleLabels[selectedUser.role]}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">نام</label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.name || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">
                    نام خانوادگی
                  </label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.lastName || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">
                    تلفن همراه
                  </label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.phoneNumber || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">ایمیل</label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.email || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">بودجه</label>
                  <p className="mt-1 text-green-300 font-semibold">
                    {formatBudget(selectedUser.budget || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">کد ملی</label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.melliCode || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">استان</label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.state || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/50">شهر</label>
                  <p className="mt-1 text-white/80">
                    {selectedUser.city || "—"}
                  </p>
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

      {/* =========================
          Edit Modal
      ========================= */}
      {modalType === "edit" && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">ویرایش کاربر</h2>
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
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    نام
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    تلفن
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    نقش
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
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
                      value="admin"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      ادمین
                    </option>
                    <option
                      value="specialist"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      متخصص
                    </option>
                    <option
                      value="customer"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      مشتری
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    بودجه (تومان)
                  </label>
                  <input
                    type="text"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    استان
                  </label>
                  <select
                    value={editState}
                    onChange={(e) => handleEditStateChange(e.target.value)}
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
                      انتخاب استان
                    </option>
                    {states.map((state) => (
                      <option
                        key={state}
                        value={state}
                        style={{ backgroundColor: "#4a4a4a", color: "white" }}
                      >
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    شهر
                  </label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    disabled={!editState || loadingEditCities}
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
                      {loadingEditCities
                        ? "در حال دریافت شهرها..."
                        : "انتخاب شهر"}
                    </option>
                    {editCities.map((city) => (
                      <option
                        key={city}
                        value={city}
                        style={{ backgroundColor: "#4a4a4a", color: "white" }}
                      >
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={savingUser}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={saveEdit}
                disabled={savingUser}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition disabled:opacity-50"
              >
                {savingUser ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Create Modal
      ========================= */}
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
                افزودن کاربر جدید
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
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    نام *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    تلفن *
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    ایمیل *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    رمز عبور *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    نقش
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
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
                      value="admin"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      ادمین
                    </option>
                    <option
                      value="specialist"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      متخصص
                    </option>
                    <option
                      value="customer"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      مشتری
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    بودجه (تومان)
                  </label>
                  <input
                    type="text"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="مثلاً 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    value={newMelliCode}
                    onChange={(e) => setNewMelliCode(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    استان *
                  </label>
                  <select
                    value={newState}
                    onChange={(e) => handleNewStateChange(e.target.value)}
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
                      {loadingStates
                        ? "در حال دریافت استان‌ها..."
                        : "انتخاب استان"}
                    </option>
                    {states.map((state) => (
                      <option
                        key={state}
                        value={state}
                        style={{ backgroundColor: "#4a4a4a", color: "white" }}
                      >
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    شهر *
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    disabled={!newState || loadingCities}
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
                      {loadingCities
                        ? "در حال دریافت شهرها..."
                        : !newState
                          ? "ابتدا استان را انتخاب کنید"
                          : "انتخاب شهر"}
                    </option>
                    {cities.map((city) => (
                      <option
                        key={city}
                        value={city}
                        style={{ backgroundColor: "#4a4a4a", color: "white" }}
                      >
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-red-300/80">
                فیلدهای ستاره دار (*) اجباری هستند
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={savingUser}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={saveNewUser}
                disabled={savingUser}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition disabled:opacity-50"
              >
                {savingUser ? "در حال افزودن..." : "افزودن"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Delete Modal
      ========================= */}
      {modalType === "delete" && selectedUser && (
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
                حذف کاربر
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف کاربر "{selectedUser.name} {selectedUser.lastName}"
                مطمئن هستید؟
                <br />
                <span className="text-sm text-red-300">
                  این عمل قابل بازگشت نیست.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 text-red-200 border border-red-400/30 rounded-lg transition disabled:opacity-50"
                >
                  {deletingUser ? "در حال حذف..." : "حذف"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
