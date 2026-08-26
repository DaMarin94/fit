import { IsNotEmpty, IsString } from 'class-validator';

/** RF-016: creación de un elemento del pool de equipamiento. */
export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
