import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveSectionDto {
  @ApiPropertyOptional({ description: '현재 문제 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentQuestionNumber?: number;
}

