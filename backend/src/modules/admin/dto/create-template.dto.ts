import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SectionStructure {
  @ApiProperty({ description: '섹션 타입' })
  @IsString()
  type: string;

  @ApiProperty({ description: '문제 개수' })
  questionCount: number;

  @ApiProperty({ description: '태그 필터', required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: '난이도 필터', required: false, enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;
}

export class CreateTemplateDto {
  @ApiProperty({ description: '템플릿 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '템플릿 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '템플릿 구조',
    type: Object,
    example: {
      sections: [
        { type: 'reading', questionCount: 20, tags: ['문법'], difficulty: 'medium' },
        { type: 'vocabulary', questionCount: 15, tags: ['어휘'] },
      ],
    },
  })
  @IsObject()
  structure: {
    sections: SectionStructure[];
  };

  @ApiProperty({ description: '문제 풀 ID 목록', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  questionPoolIds?: string[];
}

