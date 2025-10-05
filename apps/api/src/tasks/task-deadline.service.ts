import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TaskDeadlineService {
  private readonly logger = new Logger(TaskDeadlineService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Check for tasks with deadlines approaching (24 hours)
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkDeadlinesApproaching() {
    this.logger.log('Checking for tasks with approaching deadlines...');

    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find tasks due within 24 hours
      const tasks = await this.prisma.task.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: in24Hours,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          assignee: true,
          project: true,
        },
      });

      this.logger.log(`Found ${tasks.length} tasks with approaching deadlines`);

      // Send notifications
      for (const task of tasks) {
        if (task.assignee) {
          await this.notificationsService.notifyTaskDeadlineSoon(
            task.assignee.id,
            task.assignee.email,
            task.id,
            task.title,
            task.dueDate!,
          );
        }
      }

      this.logger.log('Deadline check completed');
    } catch (error) {
      this.logger.error('Error checking deadlines:', error);
    }
  }

  /**
   * Check for overdue tasks
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.log('Checking for overdue tasks...');

    try {
      const now = new Date();

      // Find overdue tasks
      const tasks = await this.prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          assignee: true,
          project: true,
        },
      });

      this.logger.log(`Found ${tasks.length} overdue tasks`);

      // Send notifications
      for (const task of tasks) {
        if (task.assignee) {
          await this.notificationsService.notifyTaskDeadlinePassed(
            task.assignee.id,
            task.assignee.email,
            task.id,
            task.title,
            task.dueDate!,
          );
        }
      }

      this.logger.log('Overdue check completed');
    } catch (error) {
      this.logger.error('Error checking overdue tasks:', error);
    }
  }

  /**
   * Check for subscriptions expiring soon (7 days)
   * Runs daily at 9 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkSubscriptionsExpiring() {
    this.logger.log('Checking for subscriptions expiring soon...');

    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find subscriptions expiring within 7 days
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          trialEndsAt: {
            gte: now,
            lte: in7Days,
          },
          status: 'trialing',
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`Found ${subscriptions.length} subscriptions expiring soon`);

      // Send notifications
      for (const subscription of subscriptions) {
        await this.notificationsService.notifySubscriptionExpiring(
          subscription.user.id,
          subscription.user.email,
          subscription.trialEndsAt!,
        );
      }

      this.logger.log('Subscription check completed');
    } catch (error) {
      this.logger.error('Error checking subscriptions:', error);
    }
  }
}
