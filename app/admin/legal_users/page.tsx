"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

interface LegalUser {
  ID: number;
  UserID: number;
  CompanyName: string;
  OfficialRegisterNumber: string;
  Address: string;
  Website: string;
  CompanyPhoneNumber: string;
  AgentName1: string;
  AgentPhoneNumber1: string;
  AgentName2: string;
  AgentPhoneNumber2: string;
  Active: boolean;
}

type ModalType = "view" | "edit" | "delete" | "create" | null;

export default function AdminLegalUsersPage() {
  const { getAccessToken } = useAuth();
  const [legalUsers, setLegalUsers] = useState<LegalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<LegalUser | null>(null);

  const [editForm, setEditForm] = useState<Partial<LegalUser>>({});

  const [newForm, setNewForm] = useState<Partial<LegalUser>>({
    UserID: 0,
    CompanyName: "",
    OfficialRegisterNumber: "",
    Address: "",
    Website: "",
    CompanyPhoneNumber: "",
    AgentName1: "",
    AgentPhoneNumber1: "",
    AgentName2: "",
    AgentPhoneNumber2: "",
    Active: true,
  });

  const fetchLegalUsers = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/legal-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let usersArray = [];
        if (Array.isArray(data)) {
          usersArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          usersArray = data.data;
        } else if (data.legalUsers && Array.isArray(data.legalUsers)) {
          usersArray = data.legalUsers;
        } else {
          usersArray = [];
        }

        const normalizedUsers = usersArray.map((user: any) => ({
          ID: user.ID || user.id || 0,
          UserID: user.UserID || user.userID || user.userId || 0,
          CompanyName: user.CompanyName || user.companyName || "",
          OfficialRegisterNumber:
            user.OfficialRegisterNumber ||
            user.officialRegisterNumber ||
            user.registerNumber ||
            "",
          Address: user.Address || user.address || "",
          Website: user.Website || user.website || "",
          CompanyPhoneNumber:
            user.CompanyPhoneNumber ||
            user.companyPhoneNumber ||
            user.companyPhone ||
            "",
          AgentName1: user.AgentName1 || user.agentName1 || "",
          AgentPhoneNumber1:
            user.AgentPhoneNumber1 ||
            user.agentPhoneNumber1 ||
            user.agentPhone1 ||
            "",
          AgentName2: user.AgentName2 || user.agentName2 || "",
          AgentPhoneNumber2:
            user.AgentPhoneNumber2 ||
            user.agentPhoneNumber2 ||
            user.agentPhone2 ||
            "",
          Active: user.Active ?? user.active ?? true,
        }));

        setLegalUsers(normalizedUsers);
      }
    } catch (error) {
      console.error("Error fetching legal users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createLegalUser = async (userData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/legal-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.UserID,
          companyName: userData.CompanyName,
          officialRegisterNumber: userData.OfficialRegisterNumber,
          address: userData.Address || "",
          website: userData.Website || "",
          companyPhoneNumber: userData.CompanyPhoneNumber || "",
          agentName1: userData.AgentName1 || "",
          agentPhoneNumber1: userData.AgentPhoneNumber1 || "",
          agentName2: userData.AgentName2 || "",
          agentPhoneNumber2: userData.AgentPhoneNumber2 || "",
        }),
      });

      if (response.ok) {
        await fetchLegalUsers();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating legal user:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const updateLegalUser = async (id: number, userData: any) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/legal-user/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.UserID,
          companyName: userData.CompanyName,
          officialRegisterNumber: userData.OfficialRegisterNumber,
          address: userData.Address || "",
          website: userData.Website || "",
          companyPhoneNumber: userData.CompanyPhoneNumber || "",
          agentName1: userData.AgentName1 || "",
          agentPhoneNumber1: userData.AgentPhoneNumber1 || "",
          agentName2: userData.AgentName2 || "",
          agentPhoneNumber2: userData.AgentPhoneNumber2 || "",
          active: userData.Active,
        }),
      });

      if (response.ok) {
        await fetchLegalUsers();
        return true;
      } else {
        const error = await response.text();
        if (error.includes("not a legal type")) {
          alert(
            "❌ این کاربر حقیقی است. فقط کاربران حقوقی می‌توانند اطلاعات حقوقی داشته باشند.\nلطفاً ابتدا نوع کاربر را به حقوقی تغییر دهید.",
          );
        } else {
          alert(`❌ خطا: ${error}`);
        }
        return false;
      }
    } catch (error) {
      console.error("Error updating legal user:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const deleteLegalUser = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/legal-user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchLegalUsers();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting legal user:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    fetchLegalUsers();
  }, []);

  const filteredUsers = legalUsers.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.ID?.toString().includes(searchTerm) ||
      user.UserID?.toString().includes(searchTerm) ||
      user.CompanyName?.toLowerCase().includes(searchLower) ||
      user.OfficialRegisterNumber?.includes(searchTerm) ||
      user.CompanyPhoneNumber?.includes(searchTerm)
    );
  });

  const handleView = (user: LegalUser) => {
    setSelectedUser(user);
    setModalType("view");
  };

  const handleEdit = (user: LegalUser) => {
    setSelectedUser(user);
    setEditForm(user);
    setModalType("edit");
  };

  const handleDeleteClick = (user: LegalUser) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  const handleCreate = () => {
    setNewForm({
      UserID: 0,
      CompanyName: "",
      OfficialRegisterNumber: "",
      Address: "",
      Website: "",
      CompanyPhoneNumber: "",
      AgentName1: "",
      AgentPhoneNumber1: "",
      AgentName2: "",
      AgentPhoneNumber2: "",
      Active: true,
    });
    setModalType("create");
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      const success = await deleteLegalUser(selectedUser.ID);
      if (success) {
        closeModal();
      }
    }
  };

  const saveEdit = async () => {
    if (selectedUser && editForm) {
      if (!editForm.UserID || editForm.UserID === 0) {
        alert("❌ User ID معتبر نیست");
        return;
      }

      const token = getAccessToken();
      if (!token) return;

      try {
        const checkResponse = await fetch(
          `${API_BASE_URL}/v1/user/${editForm.UserID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const userData = await checkResponse.json();

        if (userData.type !== "legal") {
          const confirmChange = confirm(
            `⚠️ کاربر "${userData.name} ${userData.lastName}" از نوع "حقیقی" است.\n\n` +
              `برای ذخیره اطلاعات حقوقی، باید نوع کاربر به "حقوقی" تغییر کند.\n\n` +
              `آیا می‌خواهید نوع این کاربر را به "حقوقی" تغییر دهید؟`,
          );

          if (!confirmChange) {
            return;
          }

          const updateTypeResponse = await fetch(
            `${API_BASE_URL}/v1/user/${editForm.UserID}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: userData.name,
                lastName: userData.lastName,
                phoneNumber: userData.phoneNumber,
                email: userData.email,
                role: userData.role,
                type: "legal",
                budget: userData.budget || 0,
              }),
            },
          );

          if (!updateTypeResponse.ok) {
            alert("❌ خطا در تغییر نوع کاربر");
            return;
          }
        }

        const success = await updateLegalUser(selectedUser.ID, {
          UserID: editForm.UserID,
          CompanyName: editForm.CompanyName,
          OfficialRegisterNumber: editForm.OfficialRegisterNumber,
          Address: editForm.Address,
          Website: editForm.Website,
          CompanyPhoneNumber: editForm.CompanyPhoneNumber,
          AgentName1: editForm.AgentName1,
          AgentPhoneNumber1: editForm.AgentPhoneNumber1,
          AgentName2: editForm.AgentName2,
          AgentPhoneNumber2: editForm.AgentPhoneNumber2,
          Active: editForm.Active,
        });

        if (success) {
          closeModal();
          fetchLegalUsers();
        }
      } catch (error) {
        console.error("Error:", error);
        alert("❌ خطا در ارتباط با سرور");
      }
    }
  };

  const saveNewUser = async () => {
    if (
      !newForm.CompanyName ||
      !newForm.OfficialRegisterNumber ||
      !newForm.UserID
    ) {
      alert("لطفاً فیلدهای ضروری (نام شرکت، شماره ثبت، User ID) را پر کنید");
      return;
    }

    if (newForm.UserID <= 0) {
      alert("❌ User ID باید یک عدد معتبر باشد");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    try {
      const checkResponse = await fetch(
        `${API_BASE_URL}/v1/user/${newForm.UserID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const userData = await checkResponse.json();

      if (userData.type !== "legal") {
        const confirmChange = confirm(
          `⚠️ کاربر "${userData.name} ${userData.lastName}" از نوع "حقیقی" است.\n\n` +
            `برای ثبت به عنوان کاربر حقوقی، باید نوع کاربر به "حقوقی" تغییر کند.\n\n` +
            `آیا می‌خواهید نوع این کاربر را به "حقوقی" تغییر دهید؟`,
        );

        if (!confirmChange) {
          return;
        }

        const updateTypeResponse = await fetch(
          `${API_BASE_URL}/v1/user/${newForm.UserID}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: userData.name,
              lastName: userData.lastName,
              phoneNumber: userData.phoneNumber,
              email: userData.email,
              role: userData.role,
              type: "legal",
              budget: userData.budget || 0,
            }),
          },
        );

        if (!updateTypeResponse.ok) {
          alert("❌ خطا در تغییر نوع کاربر");
          return;
        }
      }

      const success = await createLegalUser({
        UserID: newForm.UserID,
        CompanyName: newForm.CompanyName,
        OfficialRegisterNumber: newForm.OfficialRegisterNumber,
        Address: newForm.Address || "",
        Website: newForm.Website || "",
        CompanyPhoneNumber: newForm.CompanyPhoneNumber || "",
        AgentName1: newForm.AgentName1 || "",
        AgentPhoneNumber1: newForm.AgentPhoneNumber1 || "",
        AgentName2: newForm.AgentName2 || "",
        AgentPhoneNumber2: newForm.AgentPhoneNumber2 || "",
      });

      if (success) {
        closeModal();
        fetchLegalUsers();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ خطا در ارتباط با سرور");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
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
    <div className="min-h-screen  p-4 md:p-6 relative overflow-hidden">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 flex flex-col flex-1 min-h-0 overflow-hidden mt-30">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                🏢 کاربران حقوقی
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت و مشاهده اطلاعات کاربران حقوقی
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

          {/* Search Filter */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID، User ID، نام شرکت، شماره ثبت..."
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
              {filteredUsers.length} کاربر یافت شد
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 min-h-0">
            <div className="hidden md:block h-full overflow-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      نام شرکت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      شماره ثبت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      تلفن شرکت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.ID} className="hover:bg-white/10 transition">
                      <td className="px-4 py-3 text-sm text-white/80">
                        {user.ID || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {user.UserID || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white/90">
                        {user.CompanyName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {user.OfficialRegisterNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {user.CompanyPhoneNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(user)}
                            className="text-blue-300 hover:text-blue-200 px-2 py-1 rounded  transition"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-green-300 hover:text-green-200 px-2 py-1 rounded  transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
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
            <div className="md:hidden h-full overflow-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.ID}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white/40">
                      ID: {user.ID || "—"} | User ID: {user.UserID || "—"}
                    </span>
                  </div>
                  <div className="font-bold text-base text-white/90 mb-2">
                    {user.CompanyName || "—"}
                  </div>
                  <div className="text-sm text-white/60 mb-1">
                    شماره ثبت: {user.OfficialRegisterNumber || "—"}
                  </div>
                  <div className="text-sm text-white/60 mb-3">
                    تلفن: {user.CompanyPhoneNumber || "—"}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(user)}
                      className="flex-1 text-blue-300 py-2 text-sm hover:bg-blue-500/10 rounded transition"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 text-amber-300 py-2 text-sm hover:bg-amber-500/10 rounded transition"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="flex-1 text-red-300 py-2 text-sm hover:bg-red-500/10 rounded transition"
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {modalType === "view" && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                مشاهده کاربر حقوقی
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/50">ID</label>
                  <p className="text-white/80">{selectedUser.ID || "—"}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">User ID</label>
                  <p className="text-white/80">{selectedUser.UserID || "—"}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">نام شرکت</label>
                  <p className="text-white/80">
                    {selectedUser.CompanyName || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">شماره ثبت</label>
                  <p className="text-white/80">
                    {selectedUser.OfficialRegisterNumber || "—"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-white/50">آدرس</label>
                  <p className="text-white/80">{selectedUser.Address || "—"}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">وبسایت</label>
                  <p className="text-white/80">{selectedUser.Website || "—"}</p>
                </div>
                <div>
                  <label className="text-sm text-white/50">تلفن شرکت</label>
                  <p className="text-white/80">
                    {selectedUser.CompanyPhoneNumber || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">نام نماینده 1</label>
                  <p className="text-white/80">
                    {selectedUser.AgentName1 || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">
                    تلفن نماینده 1
                  </label>
                  <p className="text-white/80">
                    {selectedUser.AgentPhoneNumber1 || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">نام نماینده 2</label>
                  <p className="text-white/80">
                    {selectedUser.AgentName2 || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">
                    تلفن نماینده 2
                  </label>
                  <p className="text-white/80">
                    {selectedUser.AgentPhoneNumber2 || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">وضعیت</label>
                  <p className="text-white/80">
                    {selectedUser.Active ? "فعال" : "غیرفعال"}
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

      {/* Edit Modal */}
      {modalType === "edit" && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                ویرایش کاربر حقوقی
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    User ID
                  </label>
                  <input
                    type="number"
                    value={editForm.UserID || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        UserID: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    نام شرکت
                  </label>
                  <input
                    type="text"
                    value={editForm.CompanyName || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, CompanyName: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    شماره ثبت
                  </label>
                  <input
                    type="text"
                    value={editForm.OfficialRegisterNumber || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        OfficialRegisterNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    تلفن شرکت
                  </label>
                  <input
                    type="text"
                    value={editForm.CompanyPhoneNumber || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        CompanyPhoneNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    آدرس
                  </label>
                  <textarea
                    value={editForm.Address || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, Address: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    وبسایت
                  </label>
                  <input
                    type="text"
                    value={editForm.Website || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, Website: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    نام نماینده 1
                  </label>
                  <input
                    type="text"
                    value={editForm.AgentName1 || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, AgentName1: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    تلفن نماینده 1
                  </label>
                  <input
                    type="text"
                    value={editForm.AgentPhoneNumber1 || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        AgentPhoneNumber1: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    نام نماینده 2
                  </label>
                  <input
                    type="text"
                    value={editForm.AgentName2 || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, AgentName2: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    تلفن نماینده 2
                  </label>
                  <input
                    type="text"
                    value={editForm.AgentPhoneNumber2 || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        AgentPhoneNumber2: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    وضعیت
                  </label>
                  <select
                    value={editForm.Active ? "true" : "false"}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        Active: e.target.value === "true",
                      })
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
                      value="true"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      فعال
                    </option>
                    <option
                      value="false"
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      غیرفعال
                    </option>
                  </select>
                </div>
              </div>
              <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg p-3 mt-2 border border-yellow-400/20">
                <p className="text-sm text-yellow-200/80">
                  ⚠️ توجه: این اطلاعات فقط برای کاربرانی قابل ذخیره است که نوع
                  حساب آنها "حقوقی" باشد.
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
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="fixed bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky  z-40 top-0 bg-black backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                افزودن کاربر حقوقی جدید
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    User ID *
                  </label>
                  <input
                    type="number"
                    value={newForm.UserID || ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        UserID: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="مثال: 101"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    نام شرکت *
                  </label>
                  <input
                    type="text"
                    value={newForm.CompanyName || ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, CompanyName: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="مثال: شرکت فناوری اطلاعات"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    شماره ثبت *
                  </label>
                  <input
                    type="text"
                    value={newForm.OfficialRegisterNumber || ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        OfficialRegisterNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="مثال: 14001234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    تلفن شرکت
                  </label>
                  <input
                    type="text"
                    value={newForm.CompanyPhoneNumber || ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        CompanyPhoneNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="مثال: 021-88765432"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    آدرس
                  </label>
                  <textarea
                    value={newForm.Address || ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, Address: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    rows={2}
                    placeholder="آدرس کامل شرکت"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    وبسایت
                  </label>
                  <input
                    type="text"
                    value={newForm.Website || ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, Website: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="مثال: www.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    نام نماینده 1
                  </label>
                  <input
                    type="text"
                    value={newForm.AgentName1 || ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, AgentName1: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="نام نماینده اول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    تلفن نماینده 1
                  </label>
                  <input
                    type="text"
                    value={newForm.AgentPhoneNumber1 || ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        AgentPhoneNumber1: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="تلفن نماینده اول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    نام نماینده 2
                  </label>
                  <input
                    type="text"
                    value={newForm.AgentName2 || ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, AgentName2: e.target.value })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="نام نماینده دوم"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    تلفن نماینده 2
                  </label>
                  <input
                    type="text"
                    value={newForm.AgentPhoneNumber2 || ""}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        AgentPhoneNumber2: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="تلفن نماینده دوم"
                  />
                </div>
              </div>
              <p className="text-xs text-red-300/80">
                فیلدهای ستاره دار (*) اجباری هستند
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                انصراف
              </button>
              <button
                onClick={saveNewUser}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
              >
                افزودن کاربر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
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
                آیا از حذف کاربر "{selectedUser.CompanyName}" مطمئن هستید؟
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
