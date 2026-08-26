import { CreateBlockDto } from './create-block.dto';

/**
 * Edición de un bloque del pool: reemplazo completo del bloque, incluida su
 * lista de ejercicios (decisión de la tarea: no hay PATCH parcial de
 * ejercicios individuales).
 */
export class UpdateBlockDto extends CreateBlockDto {}
