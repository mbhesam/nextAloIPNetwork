"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";

export default function AdminNavbar() {
  const pathname = usePathname();
  const { getAccessToken, user, isLoading } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("/icon_admin.png");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdminPage = pathname.startsWith("/admin");

  // دریافت اطلاعات کاربر از API
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.ID) {
        if (user?.name) {
          setUserName(`${user.name} ${user.lastName || ""}`.trim());
        }
        return;
      }

      const token = getAccessToken();
      if (!token) return;

      try {
        const response = await fetch(
          `http://apialoipnetwork.hesamhelperdomain.ir/v1/users/${user.ID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const userData = Array.isArray(data) ? data[0] : data.data || data;
          if (userData) {
            const fullName =
              `${userData.name || ""} ${userData.lastName || ""}`.trim();
            setUserName(fullName || userData.name || "ادمین");
            if (userData.profilePicture) {
              setUserAvatar(userData.profilePicture);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        if (user?.name) {
          setUserName(`${user.name} ${user.lastName || ""}`.trim());
        }
      }
    };

    if (!isLoading) {
      if (user?.name) {
        setUserName(`${user.name} ${user.lastName || ""}`.trim());
      } else {
        fetchUserInfo();
      }
    }
  }, [user, getAccessToken, isLoading]);

  // بستن منو با کلیک ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // جلوگیری از اسکرول بدن وقتی منو باز است
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  if (!isAdminPage) return null;

  return (
    <>
      <div className="flex fixed top-0 left-0 z-50 justify-between items-center bg-box-navbar w-full h-30 px-4">
        {/* سمت راست - لوگو + دکمه همبرگر + منوی اصلی */}
        <div className="flex items-center gap-6">
          <Image
            src="/aloip-network-logo.svg"
            width={180}
            height={48}
            alt="لوگوی AloIP Network"
          />

          {/* دکمه همبرگری - فقط در موبایل و تبلت */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex font-bold text-3xl text-amber-50 lg:hidden focus:outline-none"
            aria-label="منو"
          >
            ☰
          </button>

          {/* منوی دسکتاپ */}
          <ul className="hidden lg:flex flex-wrap gap-5">
            <li>
              <Link
                href="/admin"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                داشبورد
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                کاربران
              </Link>
            </li>
            <li>
              <Link
                href="/admin/specialists"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                متخصصان
              </Link>
            </li>
            <li>
              <Link
                href="/admin/legal_users"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                کاربران حقوقی
              </Link>
            </li>
            <li>
              <Link
                href="/admin/categories"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                دسته بندی ها
              </Link>
            </li>
            <li>
              <Link
                href="/admin/shifts"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                شیفت ها
              </Link>
            </li>
            <li>
              <Link
                href="/admin/support_requests"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                درخواست های پشتیبانی
              </Link>
            </li>
            <li>
              <Link
                href="/admin/payments"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                پرداخت ها
              </Link>
            </li>
            <li>
              <Link
                href="/admin/cost_setting"
                className="flex text-(--color-text-navbar) hover:opacity-80 transition-opacity"
              >
                تنظیمات هزینه
              </Link>
            </li>
          </ul>
        </div>

        {/* سمت چپ - پروفایل کاربر */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/admin_profile"
            className="flex text-(--color-text-navbar)"
          >
            <div className="flex items-center gap-2">
              <p className="text-(--color-text-navbar) hidden sm:flex text-sm md:text-base">
                {userName || (isLoading ? "در حال بارگذاری..." : "ادمین")}
              </p>
              <Image
                className="flex rounded-full object-cover"
                src={userAvatar}
                width={45}
                height={45}
                alt="Avatar"
              />
            </div>
          </Link>
        </div>
      </div>

      {/* منوی کشویی - برای موبایل و تبلت */}
      <div
        className={`fixed top-30 right-0 z-40 bg-box-navbar w-80 h-full shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col p-5 gap-2">
          {/* هدر منو با نام کاربر */}
          <div className="flex items-center gap-3 pb-4 mb-2 border-b border-white/20">
            <Image
              className="rounded-full object-cover"
              src={userAvatar}
              width={50}
              height={50}
              alt="Avatar"
            />
            <div className="flex flex-col">
              <span className="text-white font-medium">
                {userName || "ادمین"}
              </span>
              <span className="text-white/60 text-xs">مدیر سیستم</span>
            </div>
          </div>

          <Link
            href="/admin"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>📊</span> داشبورد
          </Link>
          <Link
            href="/admin/users"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>👥</span> کاربران
          </Link>
          <Link
            href="/admin/specialists"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>👨‍🔧</span> متخصصان
          </Link>
          <Link
            href="/admin/legal_users"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>🏢</span> کاربران حقوقی
          </Link>
          <Link
            href="/admin/categories"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>📂</span> دسته بندی ها
          </Link>
          <Link
            href="/admin/shifts"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>⏰</span> شیفت ها
          </Link>
          <Link
            href="/admin/support_requests"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>🎫</span> درخواست های پشتیبانی
          </Link>
          <Link
            href="/admin/payments"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>💰</span> پرداخت ها
          </Link>
          <Link
            href="/admin/cost_setting"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>⚙️</span> تنظیمات هزینه
          </Link>
          <hr className="border-white/20 my-2" />
          <Link
            href="/admin/admin_profile"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-(--color-text-navbar) py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>👤</span> پروفایل من
          </Link>
        </div>
      </div>

      {/* اوورلی */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* استایل انیمیشن */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-in-out;
        }
      `}</style>
    </>
  );
}
