import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/types';

@ApiTags('Categories')
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Public API - 활성화된 카테고리만 조회
  @Get('public')
  @ApiOperation({ summary: '활성화된 카테고리 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공' })
  async getPublicCategories() {
    try {
      const categories = await this.categoryService.getPublicCategories();
      return {
        data: categories,
      };
    } catch (error: any) {
      console.error('Error in getPublicCategories controller:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error message:', error?.message);
      // 에러 발생 시 빈 배열 반환 (500 에러 방지)
      return {
        data: [],
      };
    }
  }

  // Public API - Slug로 카테고리 조회
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Slug로 카테고리 조회 (공개)' })
  @ApiResponse({ status: 200, description: '카테고리 조회 성공' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return {
      data: await this.categoryService.findCategoryBySlug(slug),
    };
  }

  // Admin API - Category CRUD
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '카테고리 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '카테고리 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return {
      data: await this.categoryService.createCategory(createCategoryDto),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '카테고리 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공' })
  async findAllCategories(@Query('includeInactive') includeInactive?: string) {
    return {
      data: await this.categoryService.findAllCategories(includeInactive === 'true'),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '카테고리 상세 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '카테고리 조회 성공' })
  async findCategoryById(@Param('id') id: string) {
    return {
      data: await this.categoryService.findCategoryById(id),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '카테고리 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '카테고리 수정 성공' })
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return {
      data: await this.categoryService.updateCategory(id, updateCategoryDto),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '카테고리 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '카테고리 삭제 성공' })
  async deleteCategory(@Param('id') id: string) {
    return {
      data: await this.categoryService.deleteCategory(id),
    };
  }

  // Subcategory API
  @Post('subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '서브카테고리 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '서브카테고리 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  async createSubcategory(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    return {
      data: await this.categoryService.createSubcategory(createSubcategoryDto),
    };
  }

  @Get('subcategories/all')
  @ApiOperation({ summary: '서브카테고리 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '서브카테고리 목록 조회 성공' })
  async findAllSubcategories(@Query('categoryId') categoryId?: string) {
    return {
      data: await this.categoryService.findAllSubcategories(categoryId),
    };
  }

  @Get('subcategories/:id')
  @ApiOperation({ summary: '서브카테고리 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '서브카테고리 조회 성공' })
  async findSubcategoryById(@Param('id') id: string) {
    return {
      data: await this.categoryService.findSubcategoryById(id),
    };
  }

  @Patch('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '서브카테고리 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '서브카테고리 수정 성공' })
  async updateSubcategory(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return {
      data: await this.categoryService.updateSubcategory(id, updateSubcategoryDto),
    };
  }

  @Delete('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '서브카테고리 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '서브카테고리 삭제 성공' })
  async deleteSubcategory(@Param('id') id: string) {
    return {
      data: await this.categoryService.deleteSubcategory(id),
    };
  }

  // 순서 업데이트 API
  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '카테고리 순서 일괄 업데이트 (Admin Only)' })
  @ApiResponse({ status: 200, description: '순서 업데이트 성공' })
  async updateCategoryOrders(@Body() body: { orders: { id: string; order: number }[] }) {
    return {
      data: await this.categoryService.updateCategoryOrders(body.orders),
    };
  }

  @Patch('subcategories/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '서브카테고리 순서 일괄 업데이트 (Admin Only)' })
  @ApiResponse({ status: 200, description: '순서 업데이트 성공' })
  async updateSubcategoryOrders(@Body() body: { orders: { id: string; order: number }[] }) {
    return {
      data: await this.categoryService.updateSubcategoryOrders(body.orders),
    };
  }
}

