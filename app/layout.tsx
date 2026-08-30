"use client";

import "./globals.css";
import AdminNavbar from "./components/AdminNavbar";
import SpecialistsNavbar from "./components/SpecialistsNavbar";
import UsersNavbar from "./components/UsersNavbar";
import { AuthProvider } from "./contexts/AuthContext";
import NetworkBackground from "./specialists/components/NetworkBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-full bg-transparent">
        <AuthProvider>
          <div className="relative min-h-screen bg-transparent">
            <NetworkBackground
              nodeCount={70}
              maxDist={160}
              nodeRadius={2.4}
              linkOpacity={0.5}
              speed={0.4}
              nodeColor="#62c8ff"
              linkColor="#3aa8ff"
            />
            <div className="relative z-10">
              <AdminNavbar />
              <SpecialistsNavbar />
              <UsersNavbar />
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
