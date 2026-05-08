import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ConfirmDialog({ title, onConfirm, children }: { title: string; onConfirm: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Dialog open={open}><DialogContent><p className="mb-4 text-sm">{title}</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => { onConfirm(); setOpen(false); }}>Confirm</Button></div></DialogContent></Dialog>
    </>
  );
}
