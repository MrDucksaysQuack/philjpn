import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ResultStatus } from '../../../../common/types';

export class ResultQueryDto {
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

  @ApiPropertyOptional({ enum: ResultStatus, description: '상태 필터' })
  @IsOptional()
  @IsEnum(ResultStatus)
  status?: ResultStatus;
}

