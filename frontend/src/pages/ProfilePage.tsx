import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { changePassword, deleteMe, getMe, updateMe } from "@/api/users.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";

export default function ProfilePage() {
  const { data, refetch, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => getMe().then((r) => r.data) });
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (isLoading) return <PageSkeleton />;

  return <main className="mx-auto max-w-2xl space-y-5 p-6"><h1 className="text-2xl font-semibold">Profile</h1><section className="rounded border p-4"><h2 className="mb-3 font-medium">Edit profile</h2><div className="space-y-2"><Input placeholder={data?.name ?? "Name"} value={name} onChange={(e) => setName(e.target.value)} /><Input placeholder={data?.avatarUrl ?? "Avatar URL"} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} /><Button onClick={async () => { await updateMe({ name: name || data?.name, avatarUrl: avatarUrl || data?.avatarUrl }); refetch(); }}>Save profile</Button></div></section><section className="rounded border p-4"><h2 className="mb-3 font-medium">Change password</h2><div className="space-y-2"><Input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /><Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><PasswordStrengthMeter password={newPassword} /><Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /><Button onClick={async () => changePassword({ currentPassword, newPassword, confirmPassword })}>Update password</Button></div></section><section className="rounded border border-danger-500/40 p-4"><h2 className="mb-2 font-medium text-danger-700">Danger zone</h2><ConfirmDialog title="Delete account permanently?" onConfirm={async () => deleteMe({ password: currentPassword })}><Button variant="destructive">Delete account</Button></ConfirmDialog></section></main>;
}
