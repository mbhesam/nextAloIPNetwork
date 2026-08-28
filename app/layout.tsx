"use client"


import "./globals.css";
import AdminNavbar from "./admin/admin_navbar/page";
import SpecialistsNavbar from "./specialists/specialists_navbar/page";
import UsersNavbar from "./users/users_navbar/page";
import { AuthProvider } from "./contexts/AuthContext";



  

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AdminNavbar />
          <SpecialistsNavbar />
          <UsersNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
