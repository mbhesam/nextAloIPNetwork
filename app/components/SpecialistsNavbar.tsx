"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../lib/api";
import { useEffect, useState } from "react";

export default function SpecialistsNavbar() {
  const pathname = usePathname();
  const { getAccessToken, user, isLoading } = useAuth();
  const [userName, setUserName] = useState<string>("");

  const isSpecialistsPage = pathname.startsWith("/specialists");

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.ID) {
        if (user?.name) {
          setUserName(`${user.name} ${user.lastName || ""}`);
        }
        return;
      }

      const token = getAccessToken();
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/v1/users/${user.ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const userData = Array.isArray(data) ? data[0] : data.data || data;
          if (userData) {
            const fullName =
              `${userData.name || ""} ${userData.lastName || ""}`.trim();
            setUserName(fullName || userData.name || "کاربر");
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        if (user?.name) {
          setUserName(`${user.name} ${user.lastName || ""}`);
        }
      }
    };

    if (!isLoading) {
      if (user?.name) {
        setUserName(`${user.name} ${user.lastName || ""}`);
      } else {
        fetchUserInfo();
      }
    }
  }, [user, getAccessToken, isLoading]);

  if (!isSpecialistsPage) return null;

  return (
    <div className="flex fixed top-0 left-0 z-50 justify-between items-center bg-box-navbar w-full h-30">
      <div className="flex justify-center items-center">
        <Image
          src="/aloip-network-logo.svg"
          width={180}
          height={48}
          alt="لوگوی AloIP Network"
        />
        <p className="flex font-bold text-4xl text-amber-50 lg:hidden">=</p>
        <ul className="flex flex-wrap gap-7 p-5 max-lg:hidden">
          <li>
            <Link
              href="/specialists"
              className="flex text-(--color-text-navbar)"
            >
              پیشخوان
            </Link>
          </li>
          <li>
            <Link
              href="/specialists/support_requests"
              className="flex text-(--color-text-navbar)"
            >
              درخواست های پشتیبانی
            </Link>
          </li>
          <li>
            <Link
              href="/specialists/specialist_shift"
              className="flex text-(--color-text-navbar)"
            >
              شیفت‌های من
            </Link>
          </li>
          <li>
            <Link
              href="/specialists/specialists"
              className="flex text-(--color-text-navbar)"
            >
              متخصصان
            </Link>
          </li>
        </ul>
      </div>
      <Link
        href="/specialists/profile_specialist"
        className="flex text-(--color-text-navbar)"
      >
        <div className="flex items-center gap-3 w-50">
          <p className="text-(--color-text-navbar) flex justify-end w-50">
            {userName || (isLoading ? "در حال بارگذاری..." : "کاربر")}
          </p>
          <Image
            className="flex ml-2"
            src="/icon_admin.png"
            width={50}
            height={50}
            alt="Picture of the author"
          />
        </div>
      </Link>
    </div>
  );
}
