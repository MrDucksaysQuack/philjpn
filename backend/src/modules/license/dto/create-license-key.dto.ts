import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsString,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { KeyType } from '../../../common/types';

export class CreateLicenseKeyDto {
  @ApiPropertyOptional({ description: '사용자 ID (미할당 시 null)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ enum: KeyType, description: '키 유형' })
  @IsEnum(KeyType)
  @IsString()
  keyType: KeyType;

  @ApiPropertyOptional({
    description: '사용 가능한 시험 ID 배열 (null이면 전체 접근)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  examIds?: string[];

  @ApiPropertyOptional({ description: '사용 횟수 제한 (null이면 무제한)' })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ description: '유효 시작일시' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ description: '유효 종료일시 (null이면 만료 없음)' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

