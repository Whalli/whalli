import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { CreateProjectForm } from '@whalli/types';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async create(@Body() data: CreateProjectForm & { ownerId: string }) {
    return this.projectsService.create(data);
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    return this.projectsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Partial<CreateProjectForm>) {
    return this.projectsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') projectId: string,
    @Body() data: { userId: string; role?: string }
  ) {
    return this.projectsService.addMember(projectId, data.userId, data.role);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string
  ) {
    return this.projectsService.removeMember(projectId, userId);
  }
}