import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayPickerDialog } from "./DayPickerDialog";

describe("DayPickerDialog", () => {
  it("no renderiza nada si open es false", () => {
    render(<DayPickerDialog open={false} days={[]} onSelect={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lista los días en orden y elige uno", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DayPickerDialog
        open
        days={[
          { id: "d1", order: 0 },
          { id: "d2", order: 1 },
        ]}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Día 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Día 2" }));
    expect(onSelect).toHaveBeenCalledWith("d2");
  });
});
