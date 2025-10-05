import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MindmapService } from './mindmap.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  CreateMindmapDto,
  CreateMindmapNodeDto,
  CreateMindmapEdgeDto,
} from './dto/create-mindmap.dto';
import {
  UpdateMindmapDto,
  UpdateMindmapNodeDto,
  UpdateMindmapEdgeDto,
} from './dto/update-mindmap.dto';

@Controller('mindmaps')
@UseGuards(AuthGuard)
export class MindmapController {
  constructor(private readonly mindmapService: MindmapService) {}

  // ==================== MINDMAP ROUTES ====================

  @Post()
  createMindmap(@Body() createMindmapDto: CreateMindmapDto, @Request() req) {
    return this.mindmapService.createMindmap(createMindmapDto, req.user.id);
  }

  @Get('project/:projectId')
  getMindmapsByProject(@Param('projectId') projectId: string, @Request() req) {
    return this.mindmapService.getMindmapsByProject(projectId, req.user.id);
  }

  @Get(':id')
  getMindmap(@Param('id') id: string, @Request() req) {
    return this.mindmapService.getMindmap(id, req.user.id);
  }

  @Put(':id')
  updateMindmap(
    @Param('id') id: string,
    @Body() updateMindmapDto: UpdateMindmapDto,
    @Request() req,
  ) {
    return this.mindmapService.updateMindmap(id, updateMindmapDto, req.user.id);
  }

  @Delete(':id')
  deleteMindmap(@Param('id') id: string, @Request() req) {
    return this.mindmapService.deleteMindmap(id, req.user.id);
  }

  // ==================== NODE ROUTES ====================

  @Post('nodes')
  createNode(@Body() createNodeDto: CreateMindmapNodeDto, @Request() req) {
    return this.mindmapService.createNode(createNodeDto, req.user.id);
  }

  @Get('nodes/:id')
  getNode(@Param('id') id: string, @Request() req) {
    return this.mindmapService.getNode(id, req.user.id);
  }

  @Put('nodes/:id')
  updateNode(
    @Param('id') id: string,
    @Body() updateNodeDto: UpdateMindmapNodeDto,
    @Request() req,
  ) {
    return this.mindmapService.updateNode(id, updateNodeDto, req.user.id);
  }

  @Delete('nodes/:id')
  deleteNode(@Param('id') id: string, @Request() req) {
    return this.mindmapService.deleteNode(id, req.user.id);
  }

  // ==================== EDGE ROUTES ====================

  @Post('edges')
  createEdge(@Body() createEdgeDto: CreateMindmapEdgeDto, @Request() req) {
    return this.mindmapService.createEdge(createEdgeDto, req.user.id);
  }

  @Get('edges/:id')
  getEdge(@Param('id') id: string, @Request() req) {
    return this.mindmapService.getEdge(id, req.user.id);
  }

  @Put('edges/:id')
  updateEdge(
    @Param('id') id: string,
    @Body() updateEdgeDto: UpdateMindmapEdgeDto,
    @Request() req,
  ) {
    return this.mindmapService.updateEdge(id, updateEdgeDto, req.user.id);
  }

  @Delete('edges/:id')
  deleteEdge(@Param('id') id: string, @Request() req) {
    return this.mindmapService.deleteEdge(id, req.user.id);
  }
}
