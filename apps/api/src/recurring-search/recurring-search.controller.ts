import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RecurringSearchService } from './recurring-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRecurringSearchDto, UpdateRecurringSearchDto } from './dto/create-recurring-search.dto';

@Controller('recurring-searches')
@UseGuards(JwtAuthGuard)
export class RecurringSearchController {
  constructor(private readonly recurringSearchService: RecurringSearchService) {}

  // ==================== RECURRING SEARCH ROUTES ====================

  @Post()
  createRecurringSearch(
    @Body() createDto: CreateRecurringSearchDto,
    @Request() req,
  ) {
    return this.recurringSearchService.createRecurringSearch(createDto, req.user.id);
  }

  @Get()
  getRecurringSearches(@Request() req) {
    return this.recurringSearchService.getRecurringSearches(req.user.id);
  }

  @Get(':id')
  getRecurringSearch(@Param('id') id: string, @Request() req) {
    return this.recurringSearchService.getRecurringSearch(id, req.user.id);
  }

  @Put(':id')
  updateRecurringSearch(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringSearchDto,
    @Request() req,
  ) {
    return this.recurringSearchService.updateRecurringSearch(id, updateDto, req.user.id);
  }

  @Delete(':id')
  deleteRecurringSearch(@Param('id') id: string, @Request() req) {
    return this.recurringSearchService.deleteRecurringSearch(id, req.user.id);
  }

  // ==================== SEARCH RESULT ROUTES ====================

  @Get(':id/results')
  getSearchResults(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.recurringSearchService.getSearchResults(id, req.user.id, limitNum);
  }

  @Get('results/:resultId')
  getSearchResult(@Param('resultId') resultId: string, @Request() req) {
    return this.recurringSearchService.getSearchResult(resultId, req.user.id);
  }

  // ==================== MANUAL TRIGGER ====================

  @Post(':id/execute')
  async executeSearchManually(@Param('id') id: string, @Request() req) {
    // Verify access first
    await this.recurringSearchService.getRecurringSearch(id, req.user.id);
    
    // Execute the search immediately
    await this.recurringSearchService.executeSearch(id);
    
    return { success: true, message: 'Search executed successfully' };
  }
}
