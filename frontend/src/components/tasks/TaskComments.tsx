import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { addComment, deleteComment, getComments } from "@/api/comments.api";
import type { CommentDto } from "@/api/comments.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { parseApiError } from "@/utils/errorUtils";
import { resolveAvatarUrl } from "@/utils/mediaUrl";

const MAX = 1000;

export default function TaskComments({ taskId }: { taskId: number }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => getComments(taskId).then((r) => r.data)
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => addComment(taskId, content).then((r) => r.data),
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ["comments", taskId] });
      const prev = queryClient.getQueryData<CommentDto[]>(["comments", taskId]);
      const optimistic: CommentDto = {
        id: -Date.now(),
        taskId,
        userId: 0,
        userName: "You",
        content,
        createdAt: new Date().toISOString(),
        isOwner: true
      };
      queryClient.setQueryData<CommentDto[]>(["comments", taskId], (old) => [
        ...(old ?? []),
        optimistic
      ]);
      return { prev };
    },
    onError: (err: unknown, _c, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["comments", taskId], ctx.prev);
      }
      toast.error(parseApiError(err).message);
    },
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await deleteComment(taskId, commentId);
    },
    onSuccess: async () => {
      toast.success("Comment removed");
      await queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: unknown) => toast.error(parseApiError(e).message)
  });

  const comments = commentsQuery.data ?? [];

  if (commentsQuery.isPending) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => {
            const avatarSrc = resolveAvatarUrl(c.userAvatar);
            return (
            <li
              key={c.id}
              className={`relative rounded-xl border border-gray-100 p-3 dark:border-gray-800 ${
                c.isOwner ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-white dark:bg-gray-900"
              }`}
            >
              {c.isOwner && c.id > 0 ? (
                <ConfirmDialog
                  title="Delete comment?"
                  confirmLabel="Delete"
                  onConfirm={() => deleteMutation.mutateAsync(c.id)}
                >
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-black/5 hover:text-red-600 dark:hover:bg-white/10"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </ConfirmDialog>
              ) : null}
              <div className="flex gap-3 pr-8">
                <Avatar className="h-8 w-8 shrink-0">
                  {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                  <AvatarFallback className="text-[10px]">
                    {c.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{c.userName}</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <div>
        <Textarea
          placeholder="Write a comment…"
          className="min-h-[80px] resize-none"
          maxLength={MAX}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          disabled={addMutation.isPending}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={!text.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate(text.trim())}
          >
            Post comment
          </Button>
          <span className="text-xs text-gray-400">
            {text.length}/{MAX}
          </span>
        </div>
      </div>
    </div>
  );
}
