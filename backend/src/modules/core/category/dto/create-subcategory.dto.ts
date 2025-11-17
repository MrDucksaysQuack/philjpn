import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, MaxLength, IsUUID } from 'class-validator';

export class CreateSubcategoryDto {
  @ApiProperty({ description: '카테고리 ID', example: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: '서브카테고리 이름', example: 'JLPT' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '서브카테고리 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '아이콘 이름 또는 이모지', example: '📚' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: '정렬 순서', example: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: '활성화 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

