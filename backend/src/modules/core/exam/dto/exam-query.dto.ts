import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '../../../../common/types';

export class ExamQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 크기', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ExamType, description: '시험 유형 필터' })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({ description: '과목 필터' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '공개 여부 필터' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '카테고리 ID 필터 (대분류)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: '서브카테고리 ID 필터 (중분류)' })
  @IsOptional()
  @IsString()
  subcategoryId?: string;
}

