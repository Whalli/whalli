import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { RecurringSearchService } from './recurring-search.service';

@Processor('recurring-search')
@Injectable()
export class RecurringSearchProcessor extends WorkerHost {
  constructor(private readonly recurringSearchService: RecurringSearchService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { searchId } = job.data;

    console.log(`[RecurringSearchProcessor] Processing search job for searchId: ${searchId}`);

    try {
      await this.recurringSearchService.executeSearch(searchId);
      console.log(`[RecurringSearchProcessor] Successfully executed search ${searchId}`);
    } catch (error) {
      console.error(`[RecurringSearchProcessor] Error processing search ${searchId}:`, error);
      throw error; // Re-throw to mark job as failed
    }
  }
}
