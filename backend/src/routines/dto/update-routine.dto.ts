import { CreateRoutineDto } from './create-routine.dto';

/**
 * Edición de una rutina: reemplazo completo del árbol de días y bloques
 * (borra y recrea, ver RoutinesService.update).
 */
export class UpdateRoutineDto extends CreateRoutineDto {}
