import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content className="z-20 min-w-36 rounded-md border bg-white p-2 shadow dark:bg-slate-900" sideOffset={6}>
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <DropdownPrimitive.Item onSelect={onClick} className="block w-full cursor-pointer rounded px-2 py-1 text-left text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800">
      {children}
    </DropdownPrimitive.Item>
  );
}
