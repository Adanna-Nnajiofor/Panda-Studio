"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "../lib/api";

export interface CurrentUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
}

export const useCurrentUser = (redirectTo = "/login") => {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace(redirectTo);
      return;
    }

    apiJson<{ user: CurrentUser }>("/users/profile")
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.replace(redirectTo);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, redirectTo]);

  return { user, loading };
};
