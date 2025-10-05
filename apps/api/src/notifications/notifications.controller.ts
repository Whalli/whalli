import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/notifications
   * Get all notifications for current user
   */
  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId = req.user.id;
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedUnreadOnly = unreadOnly === 'true';

    return this.notificationsService.getNotifications(
      userId,
      parsedLimit,
      parsedUnreadOnly,
    );
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(id, userId);
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.notificationsService.deleteNotification(id, userId);
  }
}
