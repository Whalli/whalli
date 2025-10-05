import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateTaskForm, UpdateTaskForm } from '@whalli/types';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: CreateTaskForm & { projectId: string }) {
    const task = await this.prisma.task.create({
      data,
      include: {
        assignee: true,
        project: {
          include: {
            owner: true,
          },
        },
        messages: {
          include: {
            user: true,
          },
        },
      },
    });

    // Send notification if task is assigned to someone
    if (task.assignee && task.assignee.id !== task.project.ownerId) {
      await this.notificationsService.notifyTaskAssigned(
        task.assignee.id,
        task.assignee.email,
        task.id,
        task.title,
        task.project.owner.name || task.project.owner.email,
      );
    }

    return task;
  }

  async findAll(projectId?: string) {
    return this.prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        assignee: true,
        project: true,
        messages: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        project: {
          include: {
            owner: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        messages: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateTaskForm) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        project: {
          include: {
            owner: true,
          },
        },
      },
    });

    const task = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: true,
        project: {
          include: {
            owner: true,
          },
        },
      },
    });

    // Send notification if assignee changed
    // Check if task has assigneeId in data (it's optional in UpdateTaskForm)
    const newAssigneeId = (data as any).assigneeId;
    if (
      newAssigneeId &&
      existingTask?.assigneeId !== newAssigneeId &&
      task.assignee &&
      task.assignee.id !== task.project.ownerId
    ) {
      await this.notificationsService.notifyTaskAssigned(
        task.assignee.id,
        task.assignee.email,
        task.id,
        task.title,
        task.project.owner.name || task.project.owner.email,
      );
    }

    return task;
  }

  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Slash command: /task create title:"Task Title" due:2025-10-10 project:"Project Name" priority:high assignee:user@example.com
   * Create a task via slash command
   */
  async createFromSlashCommand(data: {
    title: string;
    due?: string;
    project?: string;
    priority?: 'low' | 'medium' | 'high';
    assignee?: string;
    userId: string;
  }) {
    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException('Task title is required');
    }

    if (data.title.length > 500) {
      throw new BadRequestException('Task title must be less than 500 characters');
    }

    // Find project
    let projectId: string;

    if (data.project) {
      // Find project by name (user must have access)
      const projects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: data.userId },
            { members: { some: { userId: data.userId } } },
          ],
        },
      });

      const project = projects.find((p) =>
        p.title.toLowerCase().includes(data.project!.toLowerCase())
      );

      if (!project) {
        throw new NotFoundException(
          `Project matching "${data.project}" not found. Available projects: ${projects.map(p => p.title).join(', ') || 'none'}`
        );
      }

      projectId = project.id;
    } else {
      // Create or get default project
      let defaultProject = await this.prisma.project.findFirst({
        where: {
          ownerId: data.userId,
          title: 'My Tasks',
        },
      });

      if (!defaultProject) {
        defaultProject = await this.prisma.project.create({
          data: {
            title: 'My Tasks',
            description: 'Default project for tasks',
            ownerId: data.userId,
          },
        });
      }

      projectId = defaultProject.id;
    }

    // Find assignee if specified
    let assigneeId: string | null = null;
    if (data.assignee) {
      const assignee = await this.prisma.user.findUnique({
        where: { email: data.assignee },
      });

      if (!assignee) {
        throw new NotFoundException(
          `User with email "${data.assignee}" not found`
        );
      }

      assigneeId = assignee.id;
    }

    // Parse due date
    let dueDate: Date | null = null;
    if (data.due) {
      const parsed = new Date(data.due);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(
          `Invalid date format: "${data.due}". Use YYYY-MM-DD format.`
        );
      }
      dueDate = parsed;
    }

    // Map priority to status (for now, using status field)
    const status = data.priority?.toUpperCase() || 'PENDING';

    // Create task
    const task = await this.prisma.task.create({
      data: {
        title: data.title.trim(),
        projectId,
        assigneeId,
        dueDate,
        status,
      },
      include: {
        assignee: {
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
      message: `Task "${task.title}" created successfully${data.project ? ` in project "${task.project.title}"` : ''}`,
      task,
    };
  }

  /**
   * Slash command: /task complete id:task_123
   * Mark a task as complete via slash command
   */
  async completeFromSlashCommand(data: { id: string; userId: string }) {
    // Find task
    const task = await this.prisma.task.findUnique({
      where: { id: data.id },
      include: {
        project: {
          include: {
            owner: true,
            members: true,
          },
        },
        assignee: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${data.id}" not found`);
    }

    // Check if user has access to the project
    const hasAccess =
      task.project.ownerId === data.userId ||
      task.project.members.some((m) => m.userId === data.userId) ||
      task.assigneeId === data.userId;

    if (!hasAccess) {
      throw new NotFoundException(
        `Task with ID "${data.id}" not found or you don't have access`
      );
    }

    // Update task status
    const updatedTask = await this.prisma.task.update({
      where: { id: data.id },
      data: { status: 'COMPLETED' },
      include: {
        assignee: {
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
      message: `Task "${updatedTask.title}" marked as complete`,
      task: updatedTask,
    };
  }

  /**
   * Slash command: /task delete id:task_123
   * Delete a task via slash command
   */
  async deleteFromSlashCommand(data: { id: string; userId: string }) {
    // Find task
    const task = await this.prisma.task.findUnique({
      where: { id: data.id },
      include: {
        project: {
          include: {
            owner: true,
            members: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${data.id}" not found`);
    }

    // Check if user has permission (must be project owner or admin)
    const isOwner = task.project.ownerId === data.userId;
    const isAdmin = task.project.members.some(
      (m) => m.userId === data.userId && m.role === 'ADMIN'
    );

    if (!isOwner && !isAdmin) {
      throw new NotFoundException(
        `Task with ID "${data.id}" not found or you don't have permission to delete it`
      );
    }

    // Delete task
    await this.prisma.task.delete({
      where: { id: data.id },
    });

    return {
      success: true,
      message: `Task "${task.title}" deleted successfully`,
      taskId: task.id,
    };
  }
}