import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

/** RF-004/RF-005/RF-006: CRUD de rutinas. */
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get()
  findAll() {
    return this.routinesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routinesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRoutineDto) {
    return this.routinesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoutineDto) {
    return this.routinesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routinesService.remove(id);
  }
}
