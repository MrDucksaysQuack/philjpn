import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ResultStatus } from '../../../common/types';

export class AdminExamResultQueryDto {
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

  @ApiPropertyOptional({ description: '시험 ID 필터' })
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiPropertyOptional({ description: '사용자 ID 필터' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: ResultStatus, description: '상태 필터' })
  @IsOptional()
  @IsEnum(ResultStatus)
  status?: ResultStatus;

  @ApiPropertyOptional({ description: '시작일시 (from)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: '종료일시 (to)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

