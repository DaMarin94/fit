import { IsNotEmpty, IsString } from 'class-validator';

/** RF-016: edición de un elemento del pool de equipamiento. */
export class UpdateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
