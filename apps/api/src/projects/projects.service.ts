import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectForm } from '@whalli/types';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProjectForm & { ownerId: string }) {
    return this.prisma.project.create({
      data,
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
      },
    });
  }

  async findAll(userId?: string) {
    return this.prisma.project.findMany({
      where: userId
        ? {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          }
        : undefined,
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignee: true,
            messages: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateProjectForm>) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async addMember(projectId: string, userId: string, role: string = 'MEMBER') {
    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role: role as any,
      },
      include: {
        user: true,
        project: true,
      },
    });
  }

  async removeMember(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  }

  /**
   * Slash command: /project create name:"Project Name" description:"Optional description"
   * Create a project via slash command
   */
  async createFromSlashCommand(data: {
    name: string;
    description?: string;
    ownerId: string;
  }) {
    // Validate project name
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('Project name is required');
    }

    if (data.name.length > 200) {
      throw new BadRequestException('Project name must be less than 200 characters');
    }

    // Create project
    const project = await this.prisma.project.create({
      data: {
        title: data.name.trim(),
        description: data.description?.trim() || null,
        ownerId: data.ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Project "${project.title}" created successfully`,
      project,
    };
  }

  /**
   * Slash command: /project invite email:user@example.com project:"Project Name" role:member
   * Invite a user to a project via slash command
   */
  async inviteFromSlashCommand(data: {
    email: string;
    project: string;
    role?: string;
    inviterId: string;
  }) {
    // Find the project by name (partial match)
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: data.inviterId },
          { members: { some: { userId: data.inviterId } } },
        ],
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Find best matching project
    const project = projects.find(
      (p) => p.title.toLowerCase().includes(data.project.toLowerCase())
    );

    if (!project) {
      throw new NotFoundException(
        `Project matching "${data.project}" not found. Available projects: ${projects.map(p => p.title).join(', ') || 'none'}`
      );
    }

    // Check if inviter has permission (must be owner or admin)
    const isOwner = project.ownerId === data.inviterId;
    const isAdmin = project.members.some(
      (m) => m.userId === data.inviterId && m.role === 'ADMIN'
    );

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        `You don't have permission to invite members to "${project.title}"`
      );
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new NotFoundException(
        `User with email "${data.email}" not found. They must create an account first.`
      );
    }

    // Check if user is already a member
    const existingMember = project.members.find((m) => m.userId === user.id);
    if (existingMember) {
      throw new BadRequestException(
        `User "${data.email}" is already a member of "${project.title}"`
      );
    }

    // Check if user is the owner
    if (project.ownerId === user.id) {
      throw new BadRequestException(
        `User "${data.email}" is the owner of "${project.title}"`
      );
    }

    // Add member
    const role = (data.role?.toUpperCase() || 'MEMBER') as string;
    const validRoles = ['ADMIN', 'MEMBER', 'VIEWER'];
    const finalRole = validRoles.includes(role) ? role : 'MEMBER';

    const member = await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: finalRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Invited ${data.email} to "${project.title}" as ${finalRole}`,
      member,
    };
  }
}