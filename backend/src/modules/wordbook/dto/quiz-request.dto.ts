import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsEnum, IsNumber, Min } from 'class-validator';
import { Difficulty } from '../../../common/types';

export class QuizRequestDto {
  @ApiProperty({ description: '퀴즈 문제 수', minimum: 1 })
  @IsNumber()
  @Min(1)
  count: number;

  @ApiPropertyOptional({ description: '태그 필터', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ enum: Difficulty, description: '난이도 필터' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}

