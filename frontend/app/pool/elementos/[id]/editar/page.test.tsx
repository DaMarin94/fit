import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditEquipmentPage from "./page";
import * as equipmentApi from "@/lib/api/equipment";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: "eq-1" }),
}));

describe("EditEquipmentPage", () => {
  it("precarga el elemento existente y lo actualiza", async () => {
    const user = userEvent.setup();
    vi.spyOn(equipmentApi, "listEquipment").mockResolvedValue([
      { id: "eq-1", name: "Kettlebell", deletedAt: null },
      { id: "eq-2", name: "Mancuernas", deletedAt: null },
    ]);
    const updateSpy = vi
      .spyOn(equipmentApi, "updateEquipment")
      .mockResolvedValue({ id: "eq-1", name: "Kettlebell 16kg", deletedAt: null });

    render(<EditEquipmentPage />);

    const input = await screen.findByLabelText(/nombre/i);
    expect(input).toHaveValue("Kettlebell");

    await user.clear(input);
    await user.type(input, "Kettlebell 16kg");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(updateSpy).toHaveBeenCalledWith("eq-1", { name: "Kettlebell 16kg" });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
