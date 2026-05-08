import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTask } from "@/api/tasks.api";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";

export default function TaskEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateMutation } = useTasks({});
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ["task", id], queryFn: () => getTask(Number(id)).then((r) => r.data) });
  return <main className="mx-auto max-w-2xl p-6"><h1 className="mb-4 text-2xl font-semibold">Edit task</h1><TaskForm initial={data} isAdmin={user?.role === "ADMIN"} onSubmit={async (payload) => { await updateMutation.mutateAsync({ id: Number(id), payload }); navigate("/dashboard"); }} /></main>;
}
