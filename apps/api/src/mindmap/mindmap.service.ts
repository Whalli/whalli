import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class MindmapService {
  constructor(private prisma: PrismaService) {}

  // ==================== MINDMAP CRUD ====================

  async createMindmap(data: CreateMindmapDto, userId: string) {
    // Verify user has access to project
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.mindmap.create({
      data: {
        projectId: data.projectId,
        title: data.title,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });
  }

  async getMindmap(id: string, userId: string) {
    const mindmap = await this.prisma.mindmap.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
        nodes: true,
        edges: true,
      },
    });

    if (!mindmap) {
      throw new NotFoundException('Mindmap not found');
    }

    const isMember =
      mindmap.project.ownerId === userId ||
      mindmap.project.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this mindmap');
    }

    return mindmap;
  }

  async getMindmapsByProject(projectId: string, userId: string) {
    // Verify user has access to project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.mindmap.findMany({
      where: { projectId },
      include: {
        nodes: true,
        edges: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMindmap(id: string, data: UpdateMindmapDto, userId: string) {
    const mindmap = await this.getMindmap(id, userId);

    return this.prisma.mindmap.update({
      where: { id },
      data,
      include: {
        nodes: true,
        edges: true,
      },
    });
  }

  async deleteMindmap(id: string, userId: string) {
    const mindmap = await this.getMindmap(id, userId);

    return this.prisma.mindmap.delete({
      where: { id },
    });
  }

  // ==================== NODE CRUD ====================

  async createNode(data: CreateMindmapNodeDto, userId: string) {
    // Verify user has access to mindmap
    await this.getMindmap(data.mindmapId, userId);

    return this.prisma.mindmapNode.create({
      data: {
        mindmapId: data.mindmapId,
        label: data.label,
        positionX: data.positionX,
        positionY: data.positionY,
        metadata: data.metadata || {},
      },
    });
  }

  async getNode(id: string, userId: string) {
    const node = await this.prisma.mindmapNode.findUnique({
      where: { id },
      include: {
        mindmap: {
          include: {
            project: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const isMember =
      node.mindmap.project.ownerId === userId ||
      node.mindmap.project.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this node');
    }

    return node;
  }

  async updateNode(id: string, data: UpdateMindmapNodeDto, userId: string) {
    await this.getNode(id, userId);

    return this.prisma.mindmapNode.update({
      where: { id },
      data,
    });
  }

  async deleteNode(id: string, userId: string) {
    await this.getNode(id, userId);

    return this.prisma.mindmapNode.delete({
      where: { id },
    });
  }

  // ==================== EDGE CRUD ====================

  async createEdge(data: CreateMindmapEdgeDto, userId: string) {
    // Verify user has access to mindmap
    await this.getMindmap(data.mindmapId, userId);

    // Verify source and target nodes exist and belong to mindmap
    const [sourceNode, targetNode] = await Promise.all([
      this.prisma.mindmapNode.findFirst({
        where: { id: data.sourceId, mindmapId: data.mindmapId },
      }),
      this.prisma.mindmapNode.findFirst({
        where: { id: data.targetId, mindmapId: data.mindmapId },
      }),
    ]);

    if (!sourceNode || !targetNode) {
      throw new NotFoundException('Source or target node not found in this mindmap');
    }

    return this.prisma.mindmapEdge.create({
      data: {
        mindmapId: data.mindmapId,
        sourceId: data.sourceId,
        targetId: data.targetId,
        label: data.label,
        metadata: data.metadata || {},
      },
    });
  }

  async getEdge(id: string, userId: string) {
    const edge = await this.prisma.mindmapEdge.findUnique({
      where: { id },
      include: {
        mindmap: {
          include: {
            project: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!edge) {
      throw new NotFoundException('Edge not found');
    }

    const isMember =
      edge.mindmap.project.ownerId === userId ||
      edge.mindmap.project.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this edge');
    }

    return edge;
  }

  async updateEdge(id: string, data: UpdateMindmapEdgeDto, userId: string) {
    await this.getEdge(id, userId);

    return this.prisma.mindmapEdge.update({
      where: { id },
      data,
    });
  }

  async deleteEdge(id: string, userId: string) {
    await this.getEdge(id, userId);

    return this.prisma.mindmapEdge.delete({
      where: { id },
    });
  }
}
