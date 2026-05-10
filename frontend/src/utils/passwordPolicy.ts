/** Mirrors backend PasswordValidator rules for client-side gating before submit. */
export function meetsServerPasswordRules(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}
