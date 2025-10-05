import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { CreateTaskForm, UpdateTaskForm } from '@whalli/types';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(@Body() data: CreateTaskForm & { projectId: string }) {
    return this.tasksService.create(data);
  }

  @Get()
  async findAll(@Query('projectId') projectId?: string) {
    return this.tasksService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateTaskForm) {
    return this.tasksService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}