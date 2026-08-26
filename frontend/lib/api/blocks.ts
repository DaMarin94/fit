import { apiFetch } from "../http/api-client";
import type { Block, BlockInput } from "@/types/domain";

/** Llamadas a `/blocks` (`docs/data-model.md` §4.3, RF-002/RF-003). */

export function listBlocks(): Promise<Block[]> {
  return apiFetch<Block[]>("/blocks");
}

export function createBlock(input: BlockInput): Promise<Block> {
  return apiFetch<Block>("/blocks", { method: "POST", body: input });
}

/** Reemplazo completo del bloque (mismo body que crear). */
export function updateBlock(id: string, input: BlockInput): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}`, { method: "PATCH", body: input });
}

export function deleteBlock(id: string): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}`, { method: "DELETE" });
}
