import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SubmitQuestionDto {
  @ApiProperty({ description: '문제 ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: '사용자 답안' })
  @IsString()
  answer: string;

  @ApiProperty({ description: '소요 시간 (초)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  @ApiProperty({ description: '자신감 (0-1)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

