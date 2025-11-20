import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Slug 생성 (이름 기반)
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // 특수문자 제거
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/-+/g, '-') // 연속된 하이픈을 하나로
      .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
  }

  /**
   * 고유한 Slug 생성 (중복 검사)
   */
  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      // slug는 @unique이므로 findUnique에서 사용 가능하지만, 타입 정의 문제로 인해 타입 단언 사용
      const existing = await this.prisma.category.findUnique({
        where: { slug } as any,
        select: { id: true },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Category CRUD
  async createCategory(data: CreateCategoryDto) {
    // Slug 자동 생성 (제공되지 않은 경우)
    const slug = data.slug || await this.generateUniqueSlug(data.name);

    return this.prisma.category.create({
      data: {
        ...data,
        slug,
      } as any,
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Slug로 카테고리 조회
   */
  async findCategoryBySlug(slug: string, locale: string = 'ko') {
    // slug는 @unique이므로 findUnique에서 사용 가능하지만, 타입 정의 문제로 인해 타입 단언 사용
    const category = await this.prisma.category.findUnique({
      where: { slug } as any,
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
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    // 언어별 이름 적용
    const localizedName = this.getLocalizedName(category, locale);
    const localizedSubcategories = (category as any).subcategories.map((sub: any) => ({
      ...sub,
      name: this.getLocalizedName(sub, locale),
    }));

    return {
      ...category,
      name: localizedName,
      subcategories: localizedSubcategories,
    };
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
    
    // 이름이 변경되고 slug가 제공되지 않은 경우, slug 자동 업데이트
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = await this.generateUniqueSlug(data.name, id);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(slug && { slug }),
      },
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

  async findAllSubcategories(categoryId?: string, locale: string = 'ko') {
    const where: any = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const subcategories = await this.prisma.subcategory.findMany({
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

    // 언어별 이름 적용
    return subcategories.map((sub: any) => ({
      ...sub,
      name: this.getLocalizedName(sub, locale),
    }));
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
  async getPublicCategories(locale: string = 'ko') {
    try {
      // 단계별로 쿼리 실행하여 에러 위치 파악
      const categories = await this.prisma.category.findMany({
        where: { 
          isActive: true,
        },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });
      
      // _count는 별도로 계산 (에러 발생 가능성 있음)
      const categoriesWithCount = await Promise.all(
        categories.map(async (category: any) => {
          try {
            const examCount = await this.prisma.exam.count({
              where: {
                categoryId: category.id,
                isActive: true,
                isPublic: true,
              },
            });

            // 언어별 이름 선택 (우선순위: 언어별 필드 > 기본 name)
            const localizedName = this.getLocalizedName(category, locale);

            // 서브카테고리도 언어별 이름 적용
            const localizedSubcategories = category.subcategories.map((sub: any) => ({
              ...sub,
              name: this.getLocalizedName(sub, locale),
            }));

            return {
              ...category,
              name: localizedName, // 언어별 이름으로 교체
              subcategories: localizedSubcategories,
              _count: {
                exams: examCount,
              },
            };
          } catch (error) {
            console.error(`Error counting exams for category ${category.id}:`, error);
            return {
              ...category,
              name: this.getLocalizedName(category, locale),
              _count: {
                exams: 0,
              },
            };
          }
        })
      );
      
      // slug가 빈 문자열이 아닌 카테고리만 필터링 (slug는 String이므로 null이 될 수 없음)
      // 타입 단언 사용 (Prisma Client 타입 정의 문제로 인한 임시 조치)
      const filteredCategories = categoriesWithCount.filter((category: any) => 
        category.slug && typeof category.slug === 'string' && category.slug.trim() !== ''
      );
      
      console.log(`[CategoryService] Found ${categories.length} categories, ${filteredCategories.length} after filtering`);
      
      return filteredCategories;
    } catch (error: any) {
      console.error('Error fetching public categories:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error message:', error?.message);
      console.error('Error name:', error?.name);
      // 에러 발생 시 빈 배열 반환 (애플리케이션이 크래시되지 않도록)
      return [];
    }
  }

  /**
   * 언어별 이름 반환 (우선순위: 언어별 필드 > 기본 name)
   */
  private getLocalizedName(item: any, locale: string): string {
    switch (locale) {
      case 'ko':
        return item.nameKo || item.name;
      case 'en':
        return item.nameEn || item.name;
      case 'ja':
        return item.nameJa || item.name;
      default:
        return item.name;
    }
  }

  /**
   * 카테고리 순서 일괄 업데이트
   */
  async updateCategoryOrders(orders: { id: string; order: number }[]) {
    // 트랜잭션으로 일괄 업데이트
    return this.prisma.$transaction(
      orders.map(({ id, order }) =>
        this.prisma.category.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  /**
   * 서브카테고리 순서 일괄 업데이트
   */
  async updateSubcategoryOrders(orders: { id: string; order: number }[]) {
    // 트랜잭션으로 일괄 업데이트
    return this.prisma.$transaction(
      orders.map(({ id, order }) =>
        this.prisma.subcategory.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }
}

