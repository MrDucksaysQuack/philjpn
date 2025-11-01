import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({ description: '섹션 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '섹션 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '섹션 순서' })
  @IsNumber()
  @IsNotEmpty()
  order: number;

  @ApiPropertyOptional({ description: '시간 제한 (초)' })
  @IsOptional()
  @IsNumber()
  timeLimit?: number;
}

