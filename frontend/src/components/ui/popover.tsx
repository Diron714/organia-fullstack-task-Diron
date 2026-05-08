import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ children }: { children: React.ReactNode }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content sideOffset={8} className="z-30 w-80 rounded-md border bg-white p-3 shadow-lg dark:bg-slate-900">
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
