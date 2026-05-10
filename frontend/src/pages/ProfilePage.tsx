import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { changePassword, deleteMe, getMe, updateMe } from "@/api/users.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { parseApiError } from "@/utils/errorUtils";
import { useAuthStore } from "@/store/authStore";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ProfilePage() {
  usePageTitle("Profile | Organia");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data)
  });

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name);
      setAvatarUrl(data.avatarUrl ?? "");
    }
  }, [data]);

  if (isLoading || !data) {
    return <PageSkeleton variant="table" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Profile
        </h2>
        <div className="mt-6 flex flex-col gap-6 md:flex-row">
          <div className="relative mx-auto md:mx-0">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || data.avatarUrl} alt="" />
              <AvatarFallback className="text-lg">{data.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={data.email} readOnly disabled />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                {data.role}
              </Badge>
              <Badge
                className={
                  data.isVerified
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "bg-amber-100 text-amber-800 dark:text-amber-200"
                }
              >
                {data.isVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Member since {data.createdAt ? format(new Date(data.createdAt), "MMMM d, yyyy") : "—"}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Total", data.taskStats.total],
                ["Completed", data.taskStats.completed],
                ["Overdue", data.taskStats.overdue]
              ].map(([k, v]) => (
                <div
                  key={String(k)}
                  className="rounded-lg border border-gray-100 p-3 text-center dark:border-gray-800"
                >
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{v}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k}</p>
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                className="mt-1.5"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={async () => {
                const t = toast.loading("Saving…");
                try {
                  const res = await updateMe({ name: name || data.name, avatarUrl: avatarUrl || undefined });
                  if (token) {
                    setAuth(token, {
                      ...res.data,
                      isVerified: res.data.isVerified ?? data.isVerified
                    });
                  }
                  await refetch();
                  await queryClient.invalidateQueries({ queryKey: ["me"] });
                  toast.dismiss(t);
                  toast.success("Profile saved successfully");
                } catch (error) {
                  toast.dismiss(t);
                  toast.error(parseApiError(error).message);
                }
              }}
            >
              Save profile
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Change password
        </h2>
        <div className="mt-4 space-y-3">
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={newPassword} />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={async () => {
              const t = toast.loading("Updating password…");
              try {
                await changePassword({ currentPassword, newPassword, confirmPassword });
                toast.dismiss(t);
                toast.success("Password updated successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              } catch (error) {
                toast.dismiss(t);
                toast.error(parseApiError(error).message);
              }
            }}
          >
            Update password
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <h2 className="font-medium text-red-800 dark:text-red-200">Danger zone</h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          Deleting your account removes your profile. Tasks you own may need manual cleanup by an admin.
        </p>
        <ConfirmDialog
          title="Delete account?"
          description="This action cannot be undone."
          confirmLabel="Delete account"
          confirmDisabled={confirmEmail.trim() !== data.email}
          onDialogOpenChange={(open) => {
            if (!open) setConfirmEmail("");
          }}
          extraContent={
            <div className="space-y-2">
              <Label htmlFor="confirm-delete-email">Type your email to confirm</Label>
              <Input
                id="confirm-delete-email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
          }
          onConfirm={async () => {
            try {
              await deleteMe({ confirmEmail: confirmEmail.trim() });
              logout();
              navigate("/login");
              toast.success("Account deleted");
            } catch (error) {
              toast.error(parseApiError(error).message);
              throw error;
            }
          }}
        >
          <Button type="button" variant="destructive" className="mt-4">
            Delete my account
          </Button>
        </ConfirmDialog>
      </section>
    </div>
  );
}
