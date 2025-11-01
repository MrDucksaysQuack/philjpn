import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ValidateKeyDto {
  @ApiPropertyOptional({ description: '검증할 시험 ID' })
  @IsOptional()
  @IsString()
  examId?: string;
}

