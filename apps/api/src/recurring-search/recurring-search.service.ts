import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebSearchAdapter, SearchResult } from './adapters/web-search.adapter';
import { CreateRecurringSearchDto, UpdateRecurringSearchDto, IntervalType } from './dto/create-recurring-search.dto';

@Injectable()
export class RecurringSearchService {
  constructor(
    private prisma: PrismaService,
    private webSearchAdapter: WebSearchAdapter,
    private notificationsService: NotificationsService,
    @InjectQueue('recurring-search') private searchQueue: Queue,
  ) {}

  /**
   * Calculate next run time based on interval type and value
   */
  private calculateNextRun(intervalType: string, intervalValue: string): Date {
    const now = new Date();

    if (intervalType === IntervalType.HOURS) {
      const hours = parseInt(intervalValue, 10);
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    // For cron, we'll schedule it immediately and let BullMQ handle cron
    // This is a simplified approach - in production, use a cron parser library
    return new Date(now.getTime() + 60 * 1000); // 1 minute from now as placeholder
  }

  /**
   * Create a new recurring search
   */
  async createRecurringSearch(data: CreateRecurringSearchDto, userId: string) {
    const nextRunAt = this.calculateNextRun(data.intervalType, data.intervalValue);

    const recurringSearch = await this.prisma.recurringSearch.create({
      data: {
        userId,
        query: data.query,
        intervalType: data.intervalType,
        intervalValue: data.intervalValue,
        nextRunAt,
      },
    });

    // Schedule the job in BullMQ
    await this.scheduleSearch(recurringSearch.id, data);

    return recurringSearch;
  }

  /**
   * Schedule a search job in BullMQ
   */
  private async scheduleSearch(searchId: string, data: CreateRecurringSearchDto | UpdateRecurringSearchDto) {
    const jobOptions: any = {
      jobId: `recurring-search-${searchId}`,
      removeOnComplete: true,
      removeOnFail: false,
    };

    if (data.intervalType === IntervalType.CRON) {
      // Use cron pattern for scheduling
      jobOptions.repeat = {
        pattern: data.intervalValue,
      };
    } else if (data.intervalType === IntervalType.HOURS) {
      // Schedule to repeat every X hours
      const hours = parseInt(data.intervalValue, 10);
      jobOptions.repeat = {
        every: hours * 60 * 60 * 1000, // Convert hours to milliseconds
      };
    }

    await this.searchQueue.add(
      'execute-search',
      { searchId },
      jobOptions,
    );
  }

  /**
   * Get all recurring searches for a user
   */
  async getRecurringSearches(userId: string) {
    return this.prisma.recurringSearch.findMany({
      where: { userId },
      include: {
        results: {
          orderBy: { executedAt: 'desc' },
          take: 5, // Get last 5 results for each search
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single recurring search
   */
  async getRecurringSearch(id: string, userId: string) {
    const search = await this.prisma.recurringSearch.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!search) {
      throw new NotFoundException('Recurring search not found');
    }

    if (search.userId !== userId) {
      throw new ForbiddenException('You do not have access to this search');
    }

    return search;
  }

  /**
   * Update a recurring search
   */
  async updateRecurringSearch(id: string, data: UpdateRecurringSearchDto, userId: string) {
    const search = await this.getRecurringSearch(id, userId);

    // Update next run time if interval changed
    let nextRunAt = search.nextRunAt;
    if (data.intervalType || data.intervalValue) {
      const intervalType = data.intervalType || search.intervalType;
      const intervalValue = data.intervalValue || search.intervalValue;
      nextRunAt = this.calculateNextRun(intervalType, intervalValue);
    }

    const updated = await this.prisma.recurringSearch.update({
      where: { id },
      data: {
        ...data,
        nextRunAt,
      },
    });

    // Remove old job and schedule new one if interval changed
    if (data.intervalType || data.intervalValue || data.isActive === false) {
      await this.searchQueue.removeRepeatable(`recurring-search-${id}`, {
        pattern: search.intervalValue,
      });

      if (data.isActive !== false) {
        await this.scheduleSearch(id, {
          query: updated.query,
          intervalType: updated.intervalType as IntervalType,
          intervalValue: updated.intervalValue,
        });
      }
    }

    return updated;
  }

  /**
   * Delete a recurring search
   */
  async deleteRecurringSearch(id: string, userId: string) {
    const search = await this.getRecurringSearch(id, userId);

    // Remove the job from BullMQ
    await this.searchQueue.removeRepeatable(`recurring-search-${id}`, {
      pattern: search.intervalValue,
    });

    return this.prisma.recurringSearch.delete({
      where: { id },
    });
  }

  /**
   * Execute a search and store results
   * This is called by the BullMQ processor
   */
  async executeSearch(searchId: string): Promise<void> {
    const search = await this.prisma.recurringSearch.findUnique({
      where: { id: searchId },
      include: { user: true },
    });

    if (!search || !search.isActive) {
      return;
    }

    try {
      // Execute the search using the adapter
      const results = await this.webSearchAdapter.search(search.query);

      // Store the results
      await this.prisma.searchResult.create({
        data: {
          recurringSearchId: searchId,
          query: search.query,
          results: results as any, // Store as JSON
          resultCount: results.length,
        },
      });

      // Update last run time and calculate next run
      const nextRunAt = this.calculateNextRun(search.intervalType, search.intervalValue);
      await this.prisma.recurringSearch.update({
        where: { id: searchId },
        data: {
          lastRunAt: new Date(),
          nextRunAt,
        },
      });

      // Send notification if results found
      if (results.length > 0) {
        await this.notificationsService.notifyRecurringSearchResult(
          search.user.id,
          search.user.email,
          searchId,
          search.query,
          results.length,
        );
      }
    } catch (error) {
      console.error(`Error executing search ${searchId}:`, error);
      throw error;
    }
  }

  /**
   * Get search results for a specific recurring search
   */
  async getSearchResults(searchId: string, userId: string, limit = 50) {
    // Verify access
    await this.getRecurringSearch(searchId, userId);

    return this.prisma.searchResult.findMany({
      where: { recurringSearchId: searchId },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get a specific search result
   */
  async getSearchResult(resultId: string, userId: string) {
    const result = await this.prisma.searchResult.findUnique({
      where: { id: resultId },
      include: {
        recurringSearch: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Search result not found');
    }

    if (result.recurringSearch.userId !== userId) {
      throw new ForbiddenException('You do not have access to this result');
    }

    return result;
  }
}
