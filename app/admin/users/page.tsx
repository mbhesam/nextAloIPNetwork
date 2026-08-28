"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface User {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: "admin" | "specialist" | "customer";
  budget: number;
  melliCode?: string;
  city?: string;
  state?: string;
  type?: string;
  authorized?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

const roleColors = {
  admin: "bg-purple-100 text-purple-800",
  specialist: "bg-blue-100 text-blue-800",
  customer: "bg-green-100 text-green-800",
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

type Role = "admin" | "specialist" | "customer";
type ModalType = "view" | "edit" | "delete" | "create" | null;

export default function AdminUsersPage() {
  const { getAccessToken } = useAuth();

  // =========================
  // Users
  // =========================

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // Filters
  // =========================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // =========================
  // Modal
  // =========================

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // =========================
  // Edit states
  // =========================

  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("customer");
  const [editBudget, setEditBudget] = useState("");

  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");

  // =========================
  // Create states
  // =========================

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

  // =========================
  // Locations
  // =========================

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [editCities, setEditCities] = useState<string[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingEditCities, setLoadingEditCities] = useState(false);

  // =========================
  // Saving states
  // =========================

  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // =========================
  // Budget helpers
  // =========================

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

  // =========================
  // دریافت استان‌ها
  // GET /v1/states
  // =========================

  const fetchStates = async () => {
    const token = getAccessToken();

    if (!token) return;

    setLoadingStates(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/states`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Error fetching states:",
          response.status,
          await response.text(),
        );
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setStates(data);
      } else {
        setStates([]);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoadingStates(false);
    }
  };

  // =========================
  // دریافت شهرها
  // GET /v1/cities?state=...
  // =========================

  const fetchCities = async (state: string, mode: "create" | "edit") => {
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
      const response = await fetch(
        `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(state)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error(
          "Error fetching cities:",
          response.status,
          await response.text(),
        );

        if (mode === "create") {
          setCities([]);
        } else {
          setEditCities([]);
        }

        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        if (mode === "create") {
          setCities(data);
        } else {
          setEditCities(data);
        }
      } else {
        if (mode === "create") {
          setCities([]);
        } else {
          setEditCities([]);
        }
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

  // =========================
  // دریافت لیست کاربران
  // GET /v1/users
  // =========================

  const fetchUsers = async () => {
    const token = getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();

        const usersArray = Array.isArray(data)
          ? data
          : data.data || data.users || [];

        setUsers(usersArray);
      } else {
        console.error(
          "Error fetching users:",
          response.status,
          await response.text(),
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ایجاد کاربر
  // POST /v1/user
  // =========================

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
      console.log("CREATE USER BODY:", userData);

      const response = await fetch(`${API_BASE_URL}/v1/user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const responseText = await response.text();

      console.log("CREATE USER STATUS:", response.status);

      console.log("CREATE USER RESPONSE:", responseText);

      // Swagger گفته 201
      if (response.status === 201 || response.ok) {
        // دوباره کل لیست را از بک‌اند بگیر
        await fetchUsers();

        return true;
      }

      let errorMessage = responseText;

      try {
        const errorJson = JSON.parse(responseText);

        errorMessage =
          errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
        // متن ساده بوده
      }

      alert(`❌ خطا در ایجاد کاربر:\n${errorMessage}`);

      return false;
    } catch (error) {
      console.error("Error creating user:", error);

      alert("❌ خطا در ارتباط با سرور");

      return false;
    } finally {
      setSavingUser(false);
    }
  };

  // =========================
  // ویرایش کاربر
  // PUT /v1/user/{id}
  // =========================

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
      console.log("UPDATE USER:", {
        id,
        userData,
      });

      const response = await fetch(`${API_BASE_URL}/v1/user/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const responseText = await response.text();

      if (response.ok) {
        await fetchUsers();
        return true;
      }

      console.error("Update user error:", response.status, responseText);

      alert(`❌ خطا در ویرایش کاربر:\n${responseText}`);

      return false;
    } catch (error) {
      console.error("Error updating user:", error);

      alert("❌ خطا در ارتباط با سرور");

      return false;
    } finally {
      setSavingUser(false);
    }
  };

  // =========================
  // حذف کاربر
  // DELETE /v1/user/{id}
  // =========================

  const deleteUser = async (id: number) => {
    const token = getAccessToken();

    if (!token) {
      alert("توکن ورود پیدا نشد");
      return false;
    }

    setDeletingUser(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();

      if (response.ok) {
        await fetchUsers();
        return true;
      }

      console.error("Delete user error:", response.status, responseText);

      alert(`❌ خطا در حذف کاربر:\n${responseText}`);

      return false;
    } catch (error) {
      console.error("Error deleting user:", error);

      alert("❌ خطا در ارتباط با سرور");

      return false;
    } finally {
      setDeletingUser(false);
    }
  };

  // =========================
  // اولین دریافت اطلاعات
  // =========================

  useEffect(() => {
    fetchUsers();
    fetchStates();
  }, []);

  // =========================
  // تغییر استان هنگام ایجاد
  // =========================

  const handleNewStateChange = async (state: string) => {
    setNewState(state);

    // با تغییر استان، شهر قبلی پاک شود
    setNewCity("");

    if (!state) {
      setCities([]);
      return;
    }

    await fetchCities(state, "create");
  };

  // =========================
  // تغییر استان هنگام ویرایش
  // =========================

  const handleEditStateChange = async (state: string) => {
    setEditState(state);

    // شهر قبلی پاک شود
    setEditCity("");

    if (!state) {
      setEditCities([]);
      return;
    }

    await fetchCities(state, "edit");
  };

  // =========================
  // فیلتر کاربران
  // =========================

  const filteredUsers = users.filter((user) => {
    if (selectedRole !== "all" && user.role !== selectedRole) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    const searchLower = searchTerm.toLowerCase();

    return (
      user.ID?.toString().includes(searchTerm) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.phoneNumber?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  // =========================
  // مشاهده
  // =========================

  const handleView = (user: User) => {
    setSelectedUser(user);
    setModalType("view");
  };

  // =========================
  // ویرایش
  // =========================

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

    // اگر استان دارد، شهرهایش را بگیر
    if (user.state) {
      await fetchCities(user.state, "edit");
    }

    setModalType("edit");
  };

  // =========================
  // حذف
  // =========================

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  // =========================
  // ایجاد کاربر جدید
  // =========================

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

  // =========================
  // تایید حذف
  // =========================

  const confirmDelete = async () => {
    if (!selectedUser) {
      return;
    }

    const success = await deleteUser(selectedUser.ID);

    if (success) {
      closeModal();
    }
  };

  // =========================
  // ذخیره ویرایش
  // =========================

  const saveEdit = async () => {
    if (!selectedUser) {
      return;
    }

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

  // =========================
  // ذخیره کاربر جدید
  // =========================

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

      // دقیقاً مطابق Swagger
      city: newCity,
      state: newState,

      type: "national",
    };

    console.log("FINAL CREATE USER DATA:", userData);

    const success = await createUser(userData);

    if (success) {
      closeModal();
    }
  };

  // =========================
  // بستن Modal
  // =========================

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  // =========================
  // حذف فیلترها
  // =========================

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100" dir="rtl">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}

          <div className="mt-30 px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                👥 مدیریت کاربران
              </h1>

              <p className="text-gray-600 text-sm mt-1">
                مشاهده و مدیریت تمام کاربران سیستم
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
              کاربر جدید
            </button>
          </div>

          {/* Filters */}

          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>

                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، تلفن، ایمیل یا ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  فیلتر نقش
                </label>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
              {filteredUsers.length} کاربر یافت شد
            </div>
          </div>

          {/* Table */}

          <div className="flex-1 min-h-0 overflow-auto">
            {/* Desktop */}

            <div className="hidden md:block h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      شناسه
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      نام و نام خانوادگی
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      تلفن
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      ایمیل
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      نقش
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      بودجه
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.ID}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name || "—"} {user.lastName || ""}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phoneNumber || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            roleColors[user.role]
                          }`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBudget(user.budget || 0)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(user)}
                            className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md hover:bg-indigo-50"
                          >
                            مشاهده
                          </button>

                          <button
                            onClick={() => handleEdit(user)}
                            className="text-amber-600 hover:text-amber-900 px-3 py-1 rounded-md hover:bg-amber-50"
                          >
                            ویرایش
                          </button>

                          <button
                            onClick={() => handleDeleteClick(user)}
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

            {/* Mobile */}

            <div className="md:hidden">
              {filteredUsers.map((user) => (
                <div key={user.ID} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs text-gray-500">شناسه:</span>

                      <span className="text-sm font-medium mr-1">
                        {user.ID}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        roleColors[user.role]
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-base font-bold">
                      {user.name || "—"} {user.lastName || ""}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">تلفن</span>

                      <span>{user.phoneNumber || "—"}</span>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 block">ایمیل</span>

                      <span className="break-all">{user.email || "—"}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs text-gray-500 block">بودجه</span>

                    <span className="text-base font-semibold text-green-600">
                      {formatBudget(user.budget || 0)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleView(user)}
                      className="flex-1 text-indigo-600 px-3 py-2 rounded-md hover:bg-indigo-50 text-sm font-medium"
                    >
                      مشاهده
                    </button>

                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 text-amber-600 px-3 py-2 rounded-md hover:bg-amber-50 text-sm font-medium"
                    >
                      ویرایش
                    </button>

                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="flex-1 text-red-600 px-3 py-2 rounded-md hover:bg-red-50 text-sm font-medium"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
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

      {/* =========================
          View Modal
      ========================= */}

      {modalType === "view" && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده کاربر</h2>

              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">شناسه</label>

                  <p className="mt-1">{selectedUser.ID}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">نقش</label>

                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        roleColors[selectedUser.role]
                      }`}
                    >
                      {roleLabels[selectedUser.role]}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">نام</label>

                  <p className="mt-1">{selectedUser.name || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">
                    نام خانوادگی
                  </label>

                  <p className="mt-1">{selectedUser.lastName || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">
                    تلفن همراه
                  </label>

                  <p className="mt-1">{selectedUser.phoneNumber || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">ایمیل</label>

                  <p className="mt-1">{selectedUser.email || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">بودجه</label>

                  <p className="mt-1 text-green-600 font-semibold">
                    {formatBudget(selectedUser.budget || 0)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">کد ملی</label>

                  <p className="mt-1">{selectedUser.melliCode || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">استان</label>

                  <p className="mt-1">{selectedUser.state || "—"}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">شهر</label>

                  <p className="mt-1">{selectedUser.city || "—"}</p>
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

      {/* =========================
          Edit Modal
      ========================= */}

      {modalType === "edit" && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">ویرایش کاربر</h2>

              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">نام</label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    نام خانوادگی
                  </label>

                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">تلفن</label>

                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ایمیل
                  </label>

                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">نقش</label>

                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="admin">ادمین</option>

                    <option value="specialist">متخصص</option>

                    <option value="customer">مشتری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    بودجه (تومان)
                  </label>

                  <input
                    type="text"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* استان */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    استان
                  </label>

                  <select
                    value={editState}
                    onChange={(e) => handleEditStateChange(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">انتخاب استان</option>

                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* شهر */}

                <div>
                  <label className="block text-sm font-medium mb-2">شهر</label>

                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    disabled={!editState || loadingEditCities}
                    className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingEditCities
                        ? "در حال دریافت شهرها..."
                        : "انتخاب شهر"}
                    </option>

                    {editCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={savingUser}
                className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                onClick={saveEdit}
                disabled={savingUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">افزودن کاربر جدید</h2>

              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* نام */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    نام *
                  </label>

                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    autoFocus
                  />
                </div>

                {/* نام خانوادگی */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    نام خانوادگی
                  </label>

                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* تلفن */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    تلفن *
                  </label>

                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* ایمیل */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ایمیل *
                  </label>

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* رمز */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    رمز عبور *
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>

                {/* نقش */}

                <div>
                  <label className="block text-sm font-medium mb-2">نقش</label>

                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="admin">ادمین</option>

                    <option value="specialist">متخصص</option>

                    <option value="customer">مشتری</option>
                  </select>
                </div>

                {/* بودجه */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    بودجه (تومان)
                  </label>

                  <input
                    type="text"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="مثلاً 500000"
                  />
                </div>

                {/* کد ملی */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    کد ملی
                  </label>

                  <input
                    type="text"
                    value={newMelliCode}
                    onChange={(e) => setNewMelliCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* =========================
                    استان
                ========================= */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    استان *
                  </label>

                  <select
                    value={newState}
                    onChange={(e) => handleNewStateChange(e.target.value)}
                    disabled={loadingStates}
                    className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingStates
                        ? "در حال دریافت استان‌ها..."
                        : "انتخاب استان"}
                    </option>

                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* =========================
                    شهر
                ========================= */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    شهر *
                  </label>

                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    disabled={!newState || loadingCities}
                    className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingCities
                        ? "در حال دریافت شهرها..."
                        : !newState
                          ? "ابتدا استان را انتخاب کنید"
                          : "انتخاب شهر"}
                    </option>

                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-red-500">
                فیلدهای ستاره دار (*) اجباری هستند
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={savingUser}
                className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                onClick={saveNewUser}
                disabled={savingUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
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

              <h3 className="text-lg font-bold text-center mb-2">حذف کاربر</h3>

              <p className="text-gray-600 text-center mb-6">
                آیا از حذف کاربر "{selectedUser.name} {selectedUser.lastName}"
                مطمئن هستید؟
                <br />
                <span className="text-sm text-red-500">
                  این عمل قابل بازگشت نیست.
                </span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  انصراف
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
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
