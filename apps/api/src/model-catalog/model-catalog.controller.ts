import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModelCatalogService } from './model-catalog.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateCompanyDto, UpdateCompanyDto, CreateModelDto, UpdateModelDto } from './dto/model-catalog.dto';

@Controller('model-catalog')
export class ModelCatalogController {
  constructor(private readonly modelCatalogService: ModelCatalogService) {}

  // ============================================
  // PUBLIC ENDPOINTS (Frontend - User Access)
  // ============================================

  /**
   * GET /api/model-catalog/models
   * Get all models available for the current user (alias for /available)
   * This endpoint is used by the frontend chat interface
   */
  @Get('models')
  @UseGuards(AuthGuard)
  async getModels(@Request() req) {
    const userId = req.user.id;
    return this.modelCatalogService.getAvailableModels(userId);
  }

  /**
   * GET /api/model-catalog/available
   * Get all models available for the current user based on their subscription tier
   */
  @Get('available')
  @UseGuards(AuthGuard)
  async getAvailableModels(@Request() req) {
    const userId = req.user.id;
    return this.modelCatalogService.getAvailableModels(userId);
  }

  /**
   * GET /api/model-catalog/available/by-company
   * Get available models grouped by company
   */
  @Get('available/by-company')
  @UseGuards(AuthGuard)
  async getAvailableModelsByCompany(@Request() req) {
    const userId = req.user.id;
    return this.modelCatalogService.getAvailableModelsByCompany(userId);
  }

  /**
   * GET /api/model-catalog/models/:id/can-access
   * Check if current user can access a specific model
   */
  @Get('models/:id/can-access')
  @UseGuards(AuthGuard)
  async canAccessModel(@Request() req, @Param('id') modelId: string) {
    const userId = req.user.id;
    const canAccess = await this.modelCatalogService.canAccessModel(userId, modelId);
    return { canAccess };
  }

  // ============================================
  // ADMIN ENDPOINTS - COMPANIES
  // ============================================

  /**
   * GET /api/model-catalog/admin/companies
   * Get all companies (admin only)
   */
  @Get('admin/companies')
  @UseGuards(AuthGuard)
  async getAllCompanies(@Query('includeInactive') includeInactive?: string) {
    // TODO: Add admin role check
    return this.modelCatalogService.getAllCompanies(includeInactive === 'true');
  }

  /**
   * GET /api/model-catalog/admin/companies/:id
   * Get company by ID (admin only)
   */
  @Get('admin/companies/:id')
  @UseGuards(AuthGuard)
  async getCompanyById(@Param('id') id: string) {
    // TODO: Add admin role check
    return this.modelCatalogService.getCompanyById(id);
  }

  /**
   * POST /api/model-catalog/admin/companies
   * Create a new company (admin only)
   */
  @Post('admin/companies')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCompany(@Body() data: CreateCompanyDto) {
    // TODO: Add admin role check
    return this.modelCatalogService.createCompany(data);
  }

  /**
   * PUT /api/model-catalog/admin/companies/:id
   * Update company (admin only)
   */
  @Put('admin/companies/:id')
  @UseGuards(AuthGuard)
  async updateCompany(@Param('id') id: string, @Body() data: UpdateCompanyDto) {
    // TODO: Add admin role check
    return this.modelCatalogService.updateCompany(id, data);
  }

  /**
   * DELETE /api/model-catalog/admin/companies/:id
   * Delete company (admin only)
   */
  @Delete('admin/companies/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompany(@Param('id') id: string) {
    // TODO: Add admin role check
    await this.modelCatalogService.deleteCompany(id);
  }

  // ============================================
  // ADMIN ENDPOINTS - MODELS
  // ============================================

  /**
   * GET /api/model-catalog/admin/models
   * Get all models (admin only)
   */
  @Get('admin/models')
  @UseGuards(AuthGuard)
  async getAllModels(@Query('includeInactive') includeInactive?: string) {
    // TODO: Add admin role check
    return this.modelCatalogService.getAllModels(includeInactive === 'true');
  }

  /**
   * GET /api/model-catalog/admin/models/:id
   * Get model by ID (admin only)
   */
  @Get('admin/models/:id')
  @UseGuards(AuthGuard)
  async getModelById(@Param('id') id: string) {
    // TODO: Add admin role check
    return this.modelCatalogService.getModelById(id);
  }

  /**
   * POST /api/model-catalog/admin/models
   * Create a new model (admin only)
   */
  @Post('admin/models')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createModel(@Body() data: CreateModelDto) {
    // TODO: Add admin role check
    return this.modelCatalogService.createModel(data);
  }

  /**
   * PUT /api/model-catalog/admin/models/:id
   * Update model (admin only)
   */
  @Put('admin/models/:id')
  @UseGuards(AuthGuard)
  async updateModel(@Param('id') id: string, @Body() data: UpdateModelDto) {
    // TODO: Add admin role check
    return this.modelCatalogService.updateModel(id, data);
  }

  /**
   * DELETE /api/model-catalog/admin/models/:id
   * Delete model (admin only)
   */
  @Delete('admin/models/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteModel(@Param('id') id: string) {
    // TODO: Add admin role check
    await this.modelCatalogService.deleteModel(id);
  }

  // ============================================
  // ADMIN ENDPOINTS - BULK OPERATIONS
  // ============================================

  /**
   * POST /api/model-catalog/admin/bulk-import
   * Bulk import models from JSON (admin only)
   */
  @Post('admin/bulk-import')
  @UseGuards(AuthGuard)
  async bulkImportModels(@Body() data: { companyName: string; models: CreateModelDto[] }[]) {
    // TODO: Add admin role check
    return this.modelCatalogService.bulkImportModels(data);
  }
}
