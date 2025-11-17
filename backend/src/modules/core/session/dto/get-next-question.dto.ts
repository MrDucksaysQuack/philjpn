import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GetNextQuestionDto {
  @ApiPropertyOptional({ description: '현재 문제 답안 (선택사항)' })
  @IsOptional()
  @IsString()
  currentAnswer?: string;
}

