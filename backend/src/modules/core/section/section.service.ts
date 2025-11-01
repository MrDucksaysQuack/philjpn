import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  constructor(private prisma: PrismaService) {}

  async findAllByExamId(examId: string) {
    // 시험 존재 확인
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    const sections = await this.prisma.section.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return {
      data: sections.map((section) => ({
        ...section,
        questionCount: section._count.questions,
      })),
    };
  }

  async findOne(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${id}`);
    }

    return {
      ...section,
      questionCount: section._count.questions,
    };
  }

  async create(examId: string, createSectionDto: CreateSectionDto) {
    // 시험 존재 확인
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    const section = await this.prisma.section.create({
      data: {
        ...createSectionDto,
        examId,
      },
    });

    // 시험의 totalSections 업데이트
    await this.updateExamSectionCount(examId);

    return section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto) {
    const existingSection = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!existingSection) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${id}`);
    }

    const section = await this.prisma.section.update({
      where: { id },
      data: updateSectionDto,
    });

    return section;
  }

  async remove(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${id}`);
    }

    if (section._count.questions > 0) {
      throw new BadRequestException(
        '문제가 있는 섹션은 삭제할 수 없습니다. 먼저 문제를 삭제해주세요.',
      );
    }

    await this.prisma.section.delete({
      where: { id },
    });

    // 시험의 totalSections 업데이트
    await this.updateExamSectionCount(section.examId);

    return { message: '섹션이 삭제되었습니다.' };
  }

  private async updateExamSectionCount(examId: string) {
    const sectionCount = await this.prisma.section.count({
      where: { examId },
    });

    await this.prisma.exam.update({
      where: { id: examId },
      data: { totalSections: sectionCount },
    });
  }
}

