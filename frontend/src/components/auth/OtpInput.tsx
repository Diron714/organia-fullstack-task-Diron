import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (code: string) => void;
  invalid?: boolean;
}

export default function OtpInput({ value, onChange, onComplete, invalid }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setDigit = (idx: number, ch: string) => {
    const next = digits.slice();
    next[idx] = ch.replace(/\D/g, "").slice(0, 1);
    const joined = next.join("");
    onChange(joined);
    if (next[idx] && idx < 5) refs.current[idx + 1]?.focus();
    if (joined.length === 6) onComplete?.(joined);
  };

  return (
    <div
      className={cn("flex justify-center gap-3", invalid && "animate-shake")}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        onChange(pasted);
        refs.current[Math.min(pasted.length, 5)]?.focus();
        if (pasted.length === 6) onComplete?.(pasted);
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Backspace") {
              if (digits[i]) {
                setDigit(i, "");
              } else if (i > 0) {
                refs.current[i - 1]?.focus();
              }
            }
          }}
          className={cn(
            "h-14 w-12 rounded-xl border-2 border-gray-200 bg-white text-center text-xl font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white",
            "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-950",
            invalid && "border-red-500 ring-2 ring-red-100 dark:border-red-500 dark:ring-red-950/50"
          )}
          inputMode="numeric"
          maxLength={1}
          aria-invalid={invalid}
        />
      ))}
    </div>
  );
}
