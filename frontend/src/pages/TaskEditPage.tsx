import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTask } from "@/api/tasks.api";
import TaskForm from "@/components/tasks/TaskForm";
import TaskComments from "@/components/tasks/TaskComments";
import LabelBadge from "@/components/tasks/LabelBadge";
import LabelSelector from "@/components/tasks/LabelSelector";
import TimeTracker from "@/components/tasks/TimeTracker";
import TaskDependencies from "@/components/tasks/TaskDependencies";
import { useAuthStore } from "@/store/authStore";
import { useTasks } from "@/hooks/useTasks";
import { toUpdateTaskBody } from "@/types/task.types";
import type { TaskFormValues } from "@/types/task.types";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { removeLabelFromTask } from "@/api/labels.api";
import { assignTask } from "@/api/admin.api";
import { parseApiError } from "@/utils/errorUtils";
import { Button } from "@/components/ui/button";

export default function TaskEditPage() {
  usePageTitle("Edit task | Organia");
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const taskId = Number(id);
  const taskIdValid = Number.isFinite(taskId) && taskId > 0;
  const { updateMutation } = useTasks({});
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? 0;
  const isAdmin = user?.role === "ADMIN";
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(taskId).then((r) => r.data),
    enabled: taskIdValid
  });

  const refreshTask = () => {
    void queryClient.invalidateQueries({ queryKey: ["task", id] });
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  if (!taskIdValid) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-red-600 dark:text-red-400">
        Invalid task link.{" "}
        <Link to="/dashboard" className="font-medium text-indigo-600 dark:text-indigo-400">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (isPending) {
    return <PageSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <p className="text-sm text-red-600 dark:text-red-400">{parseApiError(error).message}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => void refetch()}>
            Retry
          </Button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <TaskForm
        mode="edit"
        initial={data}
        isAdmin={isAdmin}
        isSubmitting={updateMutation.isPending}
        onSubmit={async (values: TaskFormValues) => {
          await updateMutation.mutateAsync({ id: taskId, payload: toUpdateTaskBody(values) });
          if (isAdmin) {
            let nextAssign: number | null = null;
            if (values.assignedToId?.trim()) {
              const n = Number(values.assignedToId);
              nextAssign = Number.isNaN(n) ? null : n;
            }
            const prevAssign = data.assignedToId ?? null;
            if (nextAssign !== prevAssign) {
              await assignTask(taskId, nextAssign);
              await queryClient.invalidateQueries({ queryKey: ["task", id] });
              await queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
            }
          }
          navigate("/dashboard");
        }}
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 md:px-0">
        <TaskDependencies
          taskId={taskId}
          currentUserId={currentUserId}
          blocking={data.blocking ?? []}
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
          <TaskComments taskId={taskId} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Labels</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {(data.labels ?? []).map((l) => (
              <LabelBadge
                key={l.id}
                label={l}
                onRemove={() =>
                  removeLabelFromTask(taskId, l.id).then(() => refreshTask())
                }
              />
            ))}
          </div>
          <LabelSelector taskId={taskId} selectedLabels={data.labels ?? []} onUpdate={refreshTask} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Time Tracking</h2>
          <TimeTracker taskId={taskId} />
        </section>
      </div>
    </>
  );
}
