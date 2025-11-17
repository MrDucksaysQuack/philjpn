import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { KeyType } from '../../../common/types';

export class CreateBatchLicenseKeysDto {
  @ApiProperty({ description: '생성할 키 개수', minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  count: number;

  @ApiProperty({ description: '배치 이름' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '배치 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '키 타입', enum: KeyType })
  @IsEnum(KeyType)
  keyType: KeyType;

  @ApiPropertyOptional({ description: '시험 ID 목록', type: [String] })
  @IsOptional()
  @IsArray()
  examIds?: string[];

  @ApiPropertyOptional({ description: '사용 제한 (각 키당)', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: '유효 기간 (일)', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  validDays?: number;

  @ApiPropertyOptional({ description: '키 접두사 (선택사항)' })
  @IsOptional()
  @IsString()
  prefix?: string;
}

