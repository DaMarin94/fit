import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * RF-017/RN-014: `equipmentGroups` es una lista de grupos de equipo, cada
 * grupo una lista de `equipmentId` alternativos entre sí (data-model.md
 * §2.3). Cada grupo necesita al menos un elemento; un grupo vacío no es
 * representable. Cero grupos (campo ausente o `[]`) significa sin equipo.
 */
@ValidatorConstraint({ name: 'EquipmentGroupsShape', async: false })
export class EquipmentGroupsShapeConstraint
  implements ValidatorConstraintInterface
{
  validate(equipmentGroups: unknown): boolean {
    if (equipmentGroups === undefined) {
      return true;
    }
    if (!Array.isArray(equipmentGroups)) {
      return false;
    }

    return equipmentGroups.every(
      (group) =>
        Array.isArray(group) &&
        group.length > 0 &&
        group.every((item) => typeof item === 'string' && item.length > 0),
    );
  }

  defaultMessage(): string {
    return 'equipmentGroups debe ser una lista de grupos, cada uno con al menos un equipmentId (RN-014).';
  }
}
