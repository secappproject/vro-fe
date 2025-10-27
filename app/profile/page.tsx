"use client";

import { useEffect, useState } from "react";
import { User, useAuthStore } from "@/lib/types";
import { UserDataTable } from "@/components/profile/user-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getColumns } from "@/components/profile/columns";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AddUserModal } from "@/components/profile/add-user-modal"; 
import { PlusCircle } from "lucide-react";

function AdminProfileView() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    async function getUserData() {
      if (!role) return;
      setIsLoading(true);
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/users/`;
        const res = await fetch(apiUrl, {
          headers: {
            "X-User-Role": role,
          },
        });
        if (!res.ok) {
          console.error("Failed to fetch user data:", res.statusText);
          throw new Error("Gagal mengambil data pengguna");
        }
        const users = await res.json();
        setData(users);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (role === "Admin") {
      getUserData();
    }
  }, [role]);

  const handleUserUpdated = (updatedUser: User) => {
    setData((prevData) =>
      prevData.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      )
    );
  };

  const handleUserDeleted = (userId: number) => {
    setData((prevData) => prevData.filter((user) => user.id !== userId));
  };

  const handleUserAdded = (newUser: User) => {
    setData((prevData) => [newUser, ...prevData]);
  };

  const columns = getColumns(handleUserUpdated, handleUserDeleted);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl mb-4">Manajemen Pengguna</h1>
        <p className="text-muted-foreground mb-6 font-light">
          Mengatur semua akun pengguna dalam sistem.
        </p>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="md:flex md:justify-between md:items-center mb-4">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl">Manajemen Pengguna</h1>
            <p className="text-muted-foreground font-light mt-1">
              Mengatur semua akun pengguna dalam sistem.
            </p>
          </div>
          <Button className="flex w-full md:w-52" onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>
        
        <UserDataTable columns={columns} data={data} />
        
        <AddUserModal
          setIsOpen={setIsAddModalOpen}
          onUserAdded={handleUserAdded}
        />
      </Dialog>
    </div>
  );
}

function UserProfileView() {
  const { username, role, companyName, vendorType } = useAuthStore(
    (state) => state
  );

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl mb-6">Profil Saya</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username:</span>
            <span className="font-medium">{username || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">{role || "-"}</span>
          </div>
          {role === "External/Vendor" && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Perusahaan:</span>
                <span className="font-medium">{companyName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe Vendor:</span>
                <span className="font-medium">{vendorType || "-"}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const role = useAuthStore((state) => state.role);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (role === "Admin") {
    return <AdminProfileView />;
  } else {
    return <UserProfileView />;
  }
}