"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/types";
import { AdminProfileView } from "@/components/profile/profile-admin-page";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { UserProfileView } from "@/components/profile/profile-user-page";


export default function ProfilePage() {
  const role = useAuthStore((state) => state.role);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <ProfileSkeleton />
  }

  if (role === "Admin") {
    return <AdminProfileView />;
  } else {
    return <UserProfileView />;
  }
}