import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { changeUserRole, deleteUser, getAdminUsers } from "@/api/admin.api";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-users", q, page], queryFn: () => getAdminUsers({ q, page, size: 10 }).then((r) => r.data) });
  const users = data?.content ?? [];

  if (isLoading) return <PageSkeleton />;

  return <main className="p-6"><h1 className="mb-4 text-2xl font-semibold">Admin Users</h1><div className="mb-4 max-w-md"><SearchBar value={q} onChange={setQ} placeholder="Search users" /></div><div className="overflow-x-auto rounded border"><table className="min-w-full text-sm"><thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">Verified</th><th className="p-2 text-left">Actions</th></tr></thead><tbody>{users.map((u: any) => <tr key={u.id} className="border-t"><td className="p-2">{u.name}</td><td className="p-2">{u.email}</td><td className="p-2"><select className="rounded border p-1" value={u.role} onChange={async (e) => { await changeUserRole(u.id, e.target.value as any); refetch(); }}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></td><td className="p-2">{String(u.isVerified)}</td><td className="p-2"><ConfirmDialog title="Delete this user?" onConfirm={async () => { await deleteUser(u.id); refetch(); }}><button className="rounded border border-danger-500 px-2 py-1 text-danger-500">Delete</button></ConfirmDialog></td></tr>)}</tbody></table></div><Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} /></main>;
}
