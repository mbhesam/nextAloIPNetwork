// hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";

interface User {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: string;
  budget: number;
  melliCode: string;
  state: string;
  city: string;
  profilePicture?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, isLoading };
}
