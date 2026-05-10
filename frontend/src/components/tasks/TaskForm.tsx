import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Task } from "@/types/task.types";
import type { TaskFormValues } from "@/types/task.types";
import { applyServerErrors } from "@/utils/errorUtils";
import { Select, SelectItem } from "@/components/ui/select";
import { getAdminUsersList } from "@/api/admin.api";
import type { AdminUserListItem } from "@/types/user.types";

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    dueDate: z.string().optional(),
    assignedToId: z.string().optional(),
    recurrenceType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]),
    recurrenceEndDate: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.recurrenceType !== "NONE") {
      const end = data.recurrenceEndDate?.trim() ?? "";
      if (!end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required for recurring tasks",
          path: ["recurrenceEndDate"]
        });
      }
    }
  });

export default function TaskForm({
  mode,
  initial,
  onSubmit,
  isAdmin = false,
  isSubmitting = false
}: {
  mode: "create" | "edit";
  initial?: Partial<Task>;
  onSubmit: (data: TaskFormValues) => Promise<void>;
  isAdmin?: boolean;
  isSubmitting?: boolean;
}) {
  const { data: userOptions = [] } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () => getAdminUsersList().then((r) => r.data as AdminUserListItem[]),
    enabled: isAdmin && (mode === "create" || mode === "edit")
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors }
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      status: initial?.status ?? "TODO",
      priority: initial?.priority ?? "MEDIUM",
      dueDate: initial?.dueDate?.slice(0, 10) ?? "",
      assignedToId: "",
      recurrenceType: initial?.recurrenceType ?? "NONE",
      recurrenceEndDate: initial?.recurrenceEndDate?.slice(0, 10) ?? ""
    }
  });

  const status = watch("status");
  const priority = watch("priority");
  const assign = watch("assignedToId");
  const recurrenceType = watch("recurrenceType");

  useEffect(() => {
    if (initial) {
      reset({
        title: initial.title ?? "",
        description: initial.description ?? "",
        status: initial.status ?? "TODO",
        priority: initial.priority ?? "MEDIUM",
        dueDate: initial.dueDate?.slice(0, 10) ?? "",
        assignedToId: initial.assignedToId != null ? String(initial.assignedToId) : "",
        recurrenceType: initial.recurrenceType ?? "NONE",
        recurrenceEndDate: initial.recurrenceEndDate?.slice(0, 10) ?? ""
      });
    }
  }, [initial, reset]);

  const titleText = mode === "create" ? "Create task" : "Edit task";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-0 md:py-8">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">{titleText}</h1>

        <form
          className="space-y-5"
          onSubmit={handleSubmit(async (values) => {
            try {
              await onSubmit(values);
            } catch (error) {
              toast.error(applyServerErrors(error, setError));
            }
          })}
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              className="mt-1.5 text-base"
              placeholder="What needs to be done?"
              {...register("title")}
            />
            {errors.title ? (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="mt-1.5 min-h-[120px]"
              placeholder="Add more details…"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Status</Label>
              <div className="mt-1.5">
                <Select value={status} onChange={(v) => setValue("status", v as TaskFormValues["status"])}>
                  <SelectItem value="TODO">Todo</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </Select>
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <div className="mt-1.5">
                <Select value={priority} onChange={(v) => setValue("priority", v as TaskFormValues["priority"])}>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              Due date
              {initial?.isRecurring || recurrenceType !== "NONE" ? (
                <span title="Recurring task" className="inline-flex">
                  <RotateCw className="h-4 w-4 text-gray-400" aria-hidden />
                </span>
              ) : null}
            </Label>
            <Input id="dueDate" type="date" className="mt-1.5" {...register("dueDate")} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Repeat</Label>
              <div className="mt-1.5">
                <Select
                  value={recurrenceType}
                  onChange={(v) =>
                    setValue("recurrenceType", v as TaskFormValues["recurrenceType"])
                  }
                >
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </Select>
              </div>
            </div>
            {recurrenceType !== "NONE" ? (
              <div>
                <Label htmlFor="recurrenceEndDate">Repeat until</Label>
                <Input
                  id="recurrenceEndDate"
                  type="date"
                  className="mt-1.5"
                  {...register("recurrenceEndDate")}
                />
                {errors.recurrenceEndDate ? (
                  <p className="mt-1 text-xs text-red-500">{errors.recurrenceEndDate.message}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {isAdmin && (mode === "create" || mode === "edit") ? (
            <div>
              <Label>Assign to</Label>
              <div className="mt-1.5">
                <Select
                  value={assign && assign !== "" ? assign : "none"}
                  onChange={(v) => setValue("assignedToId", v === "none" ? "" : v)}
                >
                  <SelectItem value="none">Unassigned</SelectItem>
                  {userOptions.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save task"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
