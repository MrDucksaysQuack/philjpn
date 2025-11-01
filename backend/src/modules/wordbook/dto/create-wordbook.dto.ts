import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Difficulty } from '../../../common/types';

export class CreateWordBookDto {
  @ApiProperty({ description: '단어' })
  @IsString()
  word: string;

  @ApiProperty({ description: '의미' })
  @IsString()
  meaning: string;

  @ApiPropertyOptional({ description: '예문' })
  @IsOptional()
  @IsString()
  example?: string;

  @ApiPropertyOptional({ enum: Difficulty, description: '난이도' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ description: '태그 배열', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '출처 (exam_result 등)' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: '출처 ID (시험 결과 ID 등)' })
  @IsOptional()
  @IsString()
  sourceId?: string;
}

