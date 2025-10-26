import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma, PrismaClient } from '@whalli/prisma';

/**
 * PrismaService
 * 
 * Wraps the singleton Prisma client for use in NestJS.
 * This is the ONLY place in the monorepo that should access the database directly.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Use the singleton instance from @whalli/prisma
    super();
    Object.assign(this, prisma);
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}
