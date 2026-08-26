import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';

/** RF-012/RF-013: terminar un entrenamiento y consultar el historial. */
@Controller()
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  @Post('routines/:routineId/days/:dayId/workout-logs')
  create(
    @Param('routineId') routineId: string,
    @Param('dayId') dayId: string,
    @Body() dto: CreateWorkoutLogDto,
  ) {
    return this.workoutLogsService.create(routineId, dayId, dto);
  }

  @Get('workout-logs')
  findAll() {
    return this.workoutLogsService.findAll();
  }
}
