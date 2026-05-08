import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";

describe("PasswordStrengthMeter", () => {
  it("renders very weak label", () => {
    render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText(/weak|very weak/i)).toBeInTheDocument();
  });

  it("renders fair or stronger label", () => {
    render(<PasswordStrengthMeter password="Password1!" />);
    expect(screen.getByText(/fair|strong|very strong/i)).toBeInTheDocument();
  });
});
