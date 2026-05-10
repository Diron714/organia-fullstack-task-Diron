import { useNavigate } from "react-router-dom";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";
import { toCreateTaskBody } from "@/types/task.types";
import type { TaskFormValues } from "@/types/task.types";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function TaskCreatePage() {
  usePageTitle("New task | Organia");
  const navigate = useNavigate();
  const { createMutation } = useTasks({});
  const user = useAuthStore((s) => s.user);

  return (
    <TaskForm
      mode="create"
      isAdmin={user?.role === "ADMIN"}
      isSubmitting={createMutation.isPending}
      onSubmit={async (values: TaskFormValues) => {
        await createMutation.mutateAsync(toCreateTaskBody(values, user?.role === "ADMIN"));
        navigate("/dashboard");
      }}
    />
  );
}
