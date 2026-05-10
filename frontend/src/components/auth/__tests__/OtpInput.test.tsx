import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OtpInput from "@/components/auth/OtpInput";

describe("OtpInput", () => {
  it("auto-focuses to next input on digit entry", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("supports paste and auto-submit", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<OtpInput value="" onChange={onChange} onComplete={onComplete} />);
    const container = screen.getAllByRole("textbox")[0].parentElement as HTMLElement;
    fireEvent.paste(container, {
      clipboardData: { getData: () => "123456" }
    });
    expect(onChange).toHaveBeenCalledWith("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });
});
