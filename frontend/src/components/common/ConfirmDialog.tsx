import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  confirmDisabled?: boolean;
  extraContent?: ReactNode;
  onDialogOpenChange?: (open: boolean) => void;
}

export default function ConfirmDialog({
  title,
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  onConfirm,
  children,
  confirmDisabled = false,
  extraContent,
  onDialogOpenChange
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  if (!isValidElement(children)) {
    return null;
  }

  const trigger = cloneElement(children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
    onClick: (e: React.MouseEvent) => {
      (children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick?.(e);
      setOpen(true);
    }
  });

  const runConfirm = async () => {
    try {
      await Promise.resolve(onConfirm());
      setOpen(false);
    } catch {
      /* keep dialog open */
    }
  };

  return (
    <>
      {trigger}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onDialogOpenChange?.(next);
        }}
      >
        <DialogContent>
          <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          {extraContent ? <div className="mt-4">{extraContent}</div> : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={confirmDisabled}
              className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-600"
              onClick={() => void runConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
