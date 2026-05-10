import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTask } from "@/api/tasks.api";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { toUpdateTaskBody } from "@/types/task.types";
import type { TaskFormValues } from "@/types/task.types";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function TaskEditPage() {
  usePageTitle("Edit task | Organia");
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateMutation } = useTasks({});
  const { data, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(Number(id)).then((r) => r.data)
  });

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  return (
    <TaskForm
      mode="edit"
      initial={data}
      isSubmitting={updateMutation.isPending}
      onSubmit={async (values: TaskFormValues) => {
        await updateMutation.mutateAsync({ id: Number(id), payload: toUpdateTaskBody(values) });
        navigate("/dashboard");
      }}
    />
  );
}
