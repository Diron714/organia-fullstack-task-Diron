import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types/task.types";
import { applyServerErrors } from "@/utils/errorUtils";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional()
});

export default function TaskForm({ initial, onSubmit, isAdmin = false }: { initial?: Partial<Task>; onSubmit: (data: any) => Promise<void> | void; isAdmin?: boolean }) {
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "", assignedToId: "", ...initial }
  });

  useEffect(() => {
    if (initial) reset(initial);
  }, [initial, reset]);

  return <form className="space-y-4" onSubmit={handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      toast.error(applyServerErrors(error, setError));
    }
  })}><Input {...register("title")} placeholder="Title" />{errors.title && <p className="text-xs text-danger-500">{errors.title.message as string}</p>}<Textarea {...register("description")} placeholder="Description" /><div className="grid grid-cols-1 gap-3 md:grid-cols-3"><select {...register("status")} className="rounded border p-2"><option value="TODO">Todo</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select><select {...register("priority")} className="rounded border p-2"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select><Input type="date" {...register("dueDate")} /></div>{isAdmin && <Input {...register("assignedToId")} placeholder="Assign to user ID" />}<Button type="submit">Save Task</Button></form>;
}
