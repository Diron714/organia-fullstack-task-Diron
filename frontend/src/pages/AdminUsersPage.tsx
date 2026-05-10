import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal, Users } from "lucide-react";
import toast from "react-hot-toast";
import { changeUserRole, deleteUser, getAdminUsers } from "@/api/admin.api";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AdminUserRow } from "@/types/user.types";
import type { PagedResponse } from "@/types/api.types";
import { parseApiError } from "@/utils/errorUtils";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminUsersPage() {
  usePageTitle("Admin · Users | Organia");
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [q]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-users", q, page],
    queryFn: () => getAdminUsers({ q, page, size: 10 }).then((r) => r.data as PagedResponse<AdminUserRow>)
  });

  const users = data?.content ?? [];

  if (isLoading) {
    return <PageSkeleton variant="table" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all registered users</p>
        </div>
        <Badge className="w-fit border border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
          {data?.totalElements ?? 0} users
        </Badge>
      </div>

      <div className="max-w-md">
        <SearchBar value={q} onChange={setQ} placeholder="Search by name or email…" />
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <Users className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" strokeWidth={1.25} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No users found</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Verified</th>
                <th className="px-4 py-3 text-left">Tasks</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatarUrl} alt="" />
                        <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                      value={u.role}
                      onChange={async (e) => {
                        const t = toast.loading("Updating role…");
                        try {
                          await changeUserRole(u.id, e.target.value as "ADMIN" | "USER");
                          toast.dismiss(t);
                          toast.success("Role updated successfully");
                          await refetch();
                        } catch (error) {
                          toast.dismiss(t);
                          toast.error(parseApiError(error).message);
                        }
                      }}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${u.isVerified ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      {u.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.taskCount}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <ConfirmDialog
                          title={`Delete ${u.name}?`}
                          confirmLabel="Delete"
                          onConfirm={async () => {
                            await deleteUser(u.id);
                            toast.success("User deleted successfully");
                            await refetch();
                            await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
                          }}
                        >
                          <span className="block cursor-pointer px-2 py-1.5 text-sm text-red-600 dark:text-red-400">
                            Delete user
                          </span>
                        </ConfirmDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </div>
  );
}
