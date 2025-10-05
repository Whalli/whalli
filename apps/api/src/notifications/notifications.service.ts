import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { NotificationType } from '@prisma/client';

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SendInAppNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Initialize nodemailer transporter
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpFrom = this.configService.get<string>('SMTP_FROM', 'noreply@whalli.com');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP credentials not configured. Email notifications will be logged only.',
      );
      
      // Use test account for development
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'testpassword',
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(dto: SendEmailDto): Promise<boolean> {
    try {
      this.logger.log(`Sending email to: ${dto.to}, subject: ${dto.subject}`);

      const smtpFrom = this.configService.get<string>('SMTP_FROM', 'noreply@whalli.com');

      const info = await this.transporter.sendMail({
        from: smtpFrom,
        to: dto.to,
        subject: dto.subject,
        text: dto.body,
        html: dto.html || dto.body.replace(/\n/g, '<br>'),
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send email: ${message}`, stack);
      return false;
    }
  }

  /**
   * Send in-app notification (save to database)
   */
  async sendInApp(dto: SendInAppNotificationDto) {
    try {
      this.logger.log(
        `Creating in-app notification for user: ${dto.userId}, type: ${dto.type}`,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          metadata: dto.metadata || {},
          isRead: false,
        },
      });

      this.logger.log(`In-app notification created: ${notification.id}`);
      return notification;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create in-app notification: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Send both email and in-app notification
   */
  async sendBoth(
    dto: SendInAppNotificationDto & { email: string },
  ): Promise<{ email: boolean; inApp: any }> {
    const [emailResult, inAppResult] = await Promise.all([
      this.sendEmail({
        to: dto.email,
        subject: dto.title,
        body: dto.message,
      }),
      this.sendInApp(dto),
    ]);

    return {
      email: emailResult,
      inApp: inAppResult,
    };
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string, limit = 50, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // ============================================
  // EVENT HANDLERS - Triggered by other services
  // ============================================

  /**
   * Handle subscription expiring event (7 days before expiration)
   */
  async notifySubscriptionExpiring(
    userId: string,
    email: string,
    expiresAt: Date,
  ): Promise<void> {
    const daysLeft = Math.ceil(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    await this.sendBoth({
      userId,
      email,
      type: NotificationType.SUBSCRIPTION_EXPIRING,
      title: 'Subscription Expiring Soon',
      message: `Your subscription will expire in ${daysLeft} days. Please renew to continue using premium features.`,
      metadata: {
        expiresAt: expiresAt.toISOString(),
        daysLeft,
      },
    });
  }

  /**
   * Handle subscription expired event
   */
  async notifySubscriptionExpired(userId: string, email: string): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.SUBSCRIPTION_EXPIRED,
      title: 'Subscription Expired',
      message:
        'Your subscription has expired. Please renew to continue using premium features.',
      metadata: {
        expiredAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle task deadline approaching (24 hours before due date)
   */
  async notifyTaskDeadlineSoon(
    userId: string,
    email: string,
    taskId: string,
    taskTitle: string,
    dueDate: Date,
  ): Promise<void> {
    const hoursLeft = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60),
    );

    await this.sendBoth({
      userId,
      email,
      type: NotificationType.TASK_DEADLINE_SOON,
      title: 'Task Deadline Approaching',
      message: `Task "${taskTitle}" is due in ${hoursLeft} hours.`,
      metadata: {
        taskId,
        taskTitle,
        dueDate: dueDate.toISOString(),
        hoursLeft,
      },
    });
  }

  /**
   * Handle task deadline passed
   */
  async notifyTaskDeadlinePassed(
    userId: string,
    email: string,
    taskId: string,
    taskTitle: string,
    dueDate: Date,
  ): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.TASK_DEADLINE_PASSED,
      title: 'Task Deadline Passed',
      message: `Task "${taskTitle}" is overdue.`,
      metadata: {
        taskId,
        taskTitle,
        dueDate: dueDate.toISOString(),
      },
    });
  }

  /**
   * Handle task assigned to user
   */
  async notifyTaskAssigned(
    userId: string,
    email: string,
    taskId: string,
    taskTitle: string,
    assignedBy: string,
  ): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have been assigned to task: "${taskTitle}"`,
      metadata: {
        taskId,
        taskTitle,
        assignedBy,
      },
    });
  }

  /**
   * Handle recurring search result
   */
  async notifyRecurringSearchResult(
    userId: string,
    email: string,
    searchId: string,
    query: string,
    resultCount: number,
  ): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.RECURRING_SEARCH_RESULT,
      title: 'New Search Results',
      message: `Your recurring search for "${query}" has ${resultCount} new results.`,
      metadata: {
        searchId,
        query,
        resultCount,
      },
    });
  }

  /**
   * Handle payment failed event
   */
  async notifyPaymentFailed(
    userId: string,
    email: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: `Your payment of ${amount} ${currency} has failed. Please update your payment method.`,
      metadata: {
        amount,
        currency,
      },
    });
  }

  /**
   * Handle payment success event
   */
  async notifyPaymentSuccess(
    userId: string,
    email: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Your payment of ${amount} ${currency} was successful. Thank you!`,
      metadata: {
        amount,
        currency,
      },
    });
  }

  /**
   * Handle project invitation
   */
  async notifyProjectInvitation(
    userId: string,
    email: string,
    projectId: string,
    projectTitle: string,
    invitedBy: string,
  ): Promise<void> {
    await this.sendBoth({
      userId,
      email,
      type: NotificationType.PROJECT_INVITATION,
      title: 'Project Invitation',
      message: `You have been invited to join project: "${projectTitle}"`,
      metadata: {
        projectId,
        projectTitle,
        invitedBy,
      },
    });
  }
}
