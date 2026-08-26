import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EquipmentInUseException,
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

/**
 * CRUD de elementos de equipamiento del pool (RF-016), con el mismo patrón
 * que ejercicios: nombre único entre elementos no borrados (RN-005) y
 * borrado bloqueado si algún grupo de equipo de algún ejercicio lo
 * referencia (RN-013, mismo criterio que RN-007).
 */
@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.equipment.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateEquipmentDto) {
    await this.ensureNameAvailable(dto.name);
    return this.prisma.equipment.create({ data: { name: dto.name } });
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    await this.findActiveOrFail(id);
    await this.ensureNameAvailable(dto.name, id);
    return this.prisma.equipment.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string) {
    await this.findActiveOrFail(id);
    await this.ensureNotInUse(id);
    return this.prisma.equipment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findActiveOrFail(id: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!equipment) {
      throw new NotFoundWithCodeException(
        'No se encontró el elemento.',
        'EQUIPMENT_NOT_FOUND',
      );
    }
    return equipment;
  }

  private async ensureNameAvailable(name: string, excludeId?: string) {
    const existing = await this.prisma.equipment.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new NameTakenException('Ya existe un elemento con ese nombre.');
    }
  }

  private async ensureNotInUse(id: string) {
    const inGroup = await this.prisma.equipmentGroupItem.findFirst({
      where: { equipmentId: id },
    });
    if (inGroup) {
      throw new EquipmentInUseException();
    }
  }
}
