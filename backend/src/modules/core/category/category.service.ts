import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // Category CRUD
  async createCategory(data: CreateCategoryDto) {
    return this.prisma.category.create({
      data,
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAllCategories(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.category.findMany({
      where,
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            exams: {
              where: { isActive: true, isPublic: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            exams: {
              where: { isActive: true, isPublic: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    await this.findCategoryById(id);
    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteCategory(id: string) {
    await this.findCategoryById(id);
    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Subcategory CRUD
  async createSubcategory(data: CreateSubcategoryDto) {
    // Category 존재 확인
    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
    }

    return this.prisma.subcategory.create({
      data,
      include: {
        category: true,
      },
    });
  }

  async findAllSubcategories(categoryId?: string) {
    const where: any = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.prisma.subcategory.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            exams: {
              where: { isActive: true, isPublic: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findSubcategoryById(id: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: {
            exams: {
              where: { isActive: true, isPublic: true },
            },
          },
        },
      },
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    return subcategory;
  }

  async updateSubcategory(id: string, data: UpdateSubcategoryDto) {
    await this.findSubcategoryById(id);
    return this.prisma.subcategory.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async deleteSubcategory(id: string) {
    await this.findSubcategoryById(id);
    return this.prisma.subcategory.delete({
      where: { id },
    });
  }

  // Public API (활성화된 카테고리만)
  async getPublicCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            exams: {
              where: { isActive: true, isPublic: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }
}

