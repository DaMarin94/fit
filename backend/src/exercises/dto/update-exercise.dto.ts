import { IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { EquipmentGroupsShapeConstraint } from './equipment-groups.validator';

/**
 * RF-001: edición de un ejercicio del pool. `equipmentGroups` (RF-017) es un
 * reemplazo completo de los grupos existentes: no hay "grupos" identificables
 * individualmente por el cliente (decisión de la tarea, consistente con
 * PATCH /blocks/:id).
 */
export class UpdateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Validate(EquipmentGroupsShapeConstraint)
  equipmentGroups?: string[][];
}
