import { IsNotEmpty, IsString } from 'class-validator';

/** RF-001: edición de un ejercicio del pool. */
export class UpdateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
