import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { KeyType } from '../../../common/types';

export class LicenseKeyQueryDto {
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

