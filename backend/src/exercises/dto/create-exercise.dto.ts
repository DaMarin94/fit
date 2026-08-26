import { IsNotEmpty, IsString } from 'class-validator';

/** RF-001: creación de un ejercicio del pool. */
export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
