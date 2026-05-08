import { useRef } from "react";

export default function OtpInput({ value, onChange, onComplete, invalid }: { value: string; onChange: (v: string) => void; onComplete?: () => void; invalid?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setDigit = (idx: number, ch: string) => {
    const next = digits.slice();
    next[idx] = ch.replace(/\D/g, "").slice(0, 1);
    const joined = next.join("");
    onChange(joined);
    if (next[idx] && idx < 5) refs.current[idx + 1]?.focus();
    if (joined.length === 6) onComplete?.();
  };

  return (
    <div
      className={`flex gap-2 ${invalid ? "animate-shake" : ""}`}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        onChange(pasted);
        refs.current[Math.min(pasted.length, 5)]?.focus();
        if (pasted.length === 6) onComplete?.();
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
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
          className="h-12 w-12 rounded-md border text-center text-xl"
          inputMode="numeric"
          maxLength={1}
        />
      ))}
    </div>
  );
}
