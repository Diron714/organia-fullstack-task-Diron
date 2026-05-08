import { passwordLabel, getPasswordStrength } from "@/utils/passwordStrength";

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const result = getPasswordStrength(password);
  const colors = ["bg-danger-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-success-500"];
  const normalizedScore = password.length === 0 ? 0 : result.score;
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded transition-all duration-300 ${
              i <= normalizedScore - 1 ? colors[normalizedScore] : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300">
        {password.length === 0 ? "Enter a password to see strength" : passwordLabel(normalizedScore)}
        {result.feedback.suggestions[0] ? ` - ${result.feedback.suggestions[0]}` : ""}
      </p>
    </div>
  );
}
