import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { KeyType } from '../../../common/types';

export class LicenseKeyQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 크기', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: KeyType, description: '키 유형 필터' })
  @IsOptional()
  @IsEnum(KeyType)
  keyType?: KeyType;

  @ApiPropertyOptional({ description: '활성화 여부 필터' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

