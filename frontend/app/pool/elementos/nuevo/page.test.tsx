import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewEquipmentPage from "./page";
import * as equipmentApi from "@/lib/api/equipment";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("NewEquipmentPage", () => {
  it("crea el elemento y vuelve al pool", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(equipmentApi, "createEquipment")
      .mockResolvedValue({ id: "1", name: "Kettlebell", deletedAt: null });

    render(<NewEquipmentPage />);

    await user.type(screen.getByLabelText(/nombre/i), "Kettlebell");
    await user.click(screen.getByRole("button", { name: /crear elemento/i }));

    expect(createSpy).toHaveBeenCalledWith({ name: "Kettlebell" });
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });
});
