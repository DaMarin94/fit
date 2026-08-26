import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewExercisePage from "./page";
import * as exercisesApi from "@/lib/api/exercises";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("NewExercisePage", () => {
  it("crea el ejercicio y vuelve al pool", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(exercisesApi, "createExercise")
      .mockResolvedValue({ id: "1", name: "Sentadillas", deletedAt: null });

    render(<NewExercisePage />);

    await user.type(screen.getByLabelText(/nombre/i), "Sentadillas");
    await user.click(screen.getByRole("button", { name: /crear ejercicio/i }));

    expect(createSpy).toHaveBeenCalledWith({ name: "Sentadillas" });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
