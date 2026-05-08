import zxcvbn from "zxcvbn";

export const getPasswordStrength = (password: string) => zxcvbn(password);

export const passwordLabel = (score: number) => {
  switch (score) {
    case 0: return "Very weak";
    case 1: return "Weak";
    case 2: return "Fair";
    case 3: return "Strong";
    default: return "Very strong";
  }
};
