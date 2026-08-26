import { IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { EquipmentGroupsShapeConstraint } from './equipment-groups.validator';

/**
 * RF-001: creación de un ejercicio del pool. `equipmentGroups` (RF-017) es
 * opcional: una lista de grupos de equipo, cada grupo una lista de
 * `equipmentId` alternativos entre sí (RN-014). Ausente o `[]` = sin equipo.
 */
export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Validate(EquipmentGroupsShapeConstraint)
  equipmentGroups?: string[][];
}
