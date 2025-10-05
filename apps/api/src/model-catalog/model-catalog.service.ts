import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';
import { CreateCompanyDto, UpdateCompanyDto, CreateModelDto, UpdateModelDto } from './dto/model-catalog.dto';

@Injectable()
export class ModelCatalogService {
  private readonly logger = new Logger(ModelCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // COMPANIES CRUD
  // ============================================

  /**
   * Get all companies
   */
  async getAllCompanies(includeInactive = false) {
    this.logger.log(`Getting all companies (includeInactive: ${includeInactive})`);
    
    return this.prisma.company.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        models: includeInactive ? true : { where: { isActive: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        models: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    return company;
  }

  /**
   * Create company
   */
  async createCompany(data: CreateCompanyDto) {
    this.logger.log(`Creating company: ${data.name}`);

    try {
      return await this.prisma.company.create({
        data: {
          name: data.name,
          logoUrl: data.logoUrl,
          website: data.website,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(`Company with name "${data.name}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Update company
   */
  async updateCompany(id: string, data: UpdateCompanyDto) {
    this.logger.log(`Updating company: ${id}`);

    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    try {
      return await this.prisma.company.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(`Company with name "${data.name}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Delete company
   */
  async deleteCompany(id: string) {
    this.logger.log(`Deleting company: ${id}`);

    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { models: true },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    if (company.models.length > 0) {
      throw new BadRequestException(
        `Cannot delete company with ${company.models.length} associated models. Delete models first.`,
      );
    }

    return this.prisma.company.delete({ where: { id } });
  }

  // ============================================
  // MODELS CRUD
  // ============================================

  /**
   * Get all models
   */
  async getAllModels(includeInactive = false) {
    this.logger.log(`Getting all models (includeInactive: ${includeInactive})`);

    return this.prisma.model.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        company: true,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get model by ID
   */
  async getModelById(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID "${id}" not found`);
    }

    return model;
  }

  /**
   * Create model
   */
  async createModel(data: CreateModelDto) {
    this.logger.log(`Creating model: ${data.name} for company ${data.companyId}`);

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${data.companyId}" not found`);
    }

    try {
      return await this.prisma.model.create({
        data: {
          companyId: data.companyId,
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          capabilities: data.capabilities || [],
          contextWindow: data.contextWindow,
          maxOutput: data.maxOutput,
          latencyHint: data.latencyHint,
          costEstimate: data.costEstimate,
          tierRequired: data.tierRequired || SubscriptionPlan.BASIC,
          isActive: data.isActive ?? true,
          order: data.order ?? 0,
        },
        include: {
          company: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `Model with name "${data.name}" already exists for company "${company.name}"`,
        );
      }
      throw error;
    }
  }

  /**
   * Update model
   */
  async updateModel(id: string, data: UpdateModelDto) {
    this.logger.log(`Updating model: ${id}`);

    const model = await this.prisma.model.findUnique({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Model with ID "${id}" not found`);
    }

    // If updating company, verify it exists
    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with ID "${data.companyId}" not found`);
      }
    }

    try {
      return await this.prisma.model.update({
        where: { id },
        data,
        include: {
          company: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `Model with name "${data.name}" already exists for this company`,
        );
      }
      throw error;
    }
  }

  /**
   * Delete model
   */
  async deleteModel(id: string) {
    this.logger.log(`Deleting model: ${id}`);

    const model = await this.prisma.model.findUnique({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Model with ID "${id}" not found`);
    }

    return this.prisma.model.delete({ where: { id } });
  }

  // ============================================
  // FRONTEND - AVAILABLE MODELS BY USER TIER
  // ============================================

  /**
   * Get available models for a user based on their subscription tier
   * This is the main endpoint for the frontend to get models
   */
  async getAvailableModels(userId: string) {
    this.logger.log(`Getting available models for user: ${userId}`);

    // Get user with subscription
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Determine user's subscription plan
    const userPlan = user.subscription?.plan || SubscriptionPlan.BASIC;
    
    this.logger.log(`User ${userId} has plan: ${userPlan}`);

    // Get tier hierarchy
    const tierHierarchy = this.getTierHierarchy(userPlan);

    // Get all active models that match user's tier or lower
    const models = await this.prisma.model.findMany({
      where: {
        isActive: true,
        tierRequired: {
          in: tierHierarchy,
        },
        company: {
          isActive: true,
        },
      },
      include: {
        company: true,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    // All models already filtered by active companies
    const filteredModels = models;

    this.logger.log(`Found ${filteredModels.length} available models for user ${userId}`);

    return {
      userPlan,
      totalModels: filteredModels.length,
      models: filteredModels,
    };
  }

  /**
   * Get models grouped by company (for frontend UI)
   */
  async getAvailableModelsByCompany(userId: string) {
    // Get user with subscription to determine tier
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userPlan = user.subscription?.plan || SubscriptionPlan.BASIC;
    const tierHierarchy = this.getTierHierarchy(userPlan);

    // Get all active models with company included
    const models = await this.prisma.model.findMany({
      where: {
        isActive: true,
        tierRequired: {
          in: tierHierarchy,
        },
        company: {
          isActive: true,
        },
      },
      include: {
        company: true,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    // Group models by company
    const modelsByCompany = models.reduce((acc, model) => {
      const companyId = model.company.id;
      
      if (!acc[companyId]) {
        acc[companyId] = {
          company: {
            id: model.company.id,
            name: model.company.name,
            logoUrl: model.company.logoUrl,
            website: model.company.website,
          },
          models: [],
        };
      }

      acc[companyId].models.push({
        id: model.id,
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        capabilities: model.capabilities,
        contextWindow: model.contextWindow,
        maxOutput: model.maxOutput,
        latencyHint: model.latencyHint,
        costEstimate: model.costEstimate,
        tierRequired: model.tierRequired,
      });

      return acc;
    }, {} as Record<string, any>);

    return {
      userPlan,
      totalModels: models.length,
      companies: Object.values(modelsByCompany),
    };
  }

  /**
   * Check if a user can access a specific model
   */
  async canAccessModel(userId: string, modelId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return false;
    }

    const model = await this.prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model || !model.isActive) {
      return false;
    }

    const userPlan = user.subscription?.plan || SubscriptionPlan.BASIC;
    const tierHierarchy = this.getTierHierarchy(userPlan);

    return tierHierarchy.includes(model.tierRequired);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get tier hierarchy (includes current tier and all lower tiers)
   */
  private getTierHierarchy(plan: SubscriptionPlan): SubscriptionPlan[] {
    const hierarchy = {
      [SubscriptionPlan.BASIC]: [SubscriptionPlan.BASIC],
      [SubscriptionPlan.PRO]: [SubscriptionPlan.BASIC, SubscriptionPlan.PRO],
      [SubscriptionPlan.ENTERPRISE]: [
        SubscriptionPlan.BASIC,
        SubscriptionPlan.PRO,
        SubscriptionPlan.ENTERPRISE,
      ],
    };

    return hierarchy[plan] || [SubscriptionPlan.BASIC];
  }

  /**
   * Bulk import models from JSON (for seeding)
   */
  async bulkImportModels(data: { companyName: string; models: CreateModelDto[] }[]) {
    this.logger.log(`Bulk importing models for ${data.length} companies`);

    const results = {
      companiesCreated: 0,
      modelsCreated: 0,
      errors: [] as string[],
    };

    for (const entry of data) {
      try {
        // Find or create company
        let company = await this.prisma.company.findFirst({
          where: { name: entry.companyName },
        });

        if (!company) {
          company = await this.prisma.company.create({
            data: { name: entry.companyName },
          });
          results.companiesCreated++;
        }

        // Create models
        for (const modelData of entry.models) {
          try {
            await this.createModel({
              ...modelData,
              companyId: company.id,
            });
            results.modelsCreated++;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            results.errors.push(`Model ${modelData.name}: ${message}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Company ${entry.companyName}: ${message}`);
      }
    }

    this.logger.log(
      `Bulk import completed: ${results.companiesCreated} companies, ${results.modelsCreated} models created`,
    );

    return results;
  }
}
