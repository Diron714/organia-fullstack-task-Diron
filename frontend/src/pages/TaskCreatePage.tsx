import { useNavigate } from "react-router-dom";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";

export default function TaskCreatePage() {
  const navigate = useNavigate();
  const { createMutation } = useTasks({});
  const user = useAuthStore((s) => s.user);
  return <main className="mx-auto max-w-2xl p-6"><h1 className="mb-4 text-2xl font-semibold">Create task</h1><TaskForm isAdmin={user?.role === "ADMIN"} onSubmit={async (data) => { await createMutation.mutateAsync(data); navigate("/dashboard"); }} /></main>;
}
