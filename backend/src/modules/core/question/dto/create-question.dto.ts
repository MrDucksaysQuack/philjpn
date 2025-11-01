import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import { QuestionType, Difficulty } from '../../../../common/types';

export class QuestionOptionDto {
  @ApiProperty({ description: '옵션 ID (예: A, B, C, D)' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '옵션 텍스트' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class CreateQuestionDto {
  @ApiProperty({ description: '문항 번호 (섹션 내)' })
  @IsNumber()
  @IsNotEmpty()
  questionNumber: number;

  @ApiProperty({ enum: QuestionType, description: '문제 유형' })
  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType: QuestionType;

  @ApiProperty({ description: '문제 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: '선택지 배열 (multiple_choice일 때 필요)',
    type: [QuestionOptionDto],
  })
  @IsOptional()
  @IsArray()
  options?: QuestionOptionDto[];

  @ApiProperty({ description: '정답' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiPropertyOptional({ description: '해설' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ description: '배점', default: 1 })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiPropertyOptional({ enum: Difficulty, description: '난이도' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ description: '태그 배열', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '문제은행 ID' })
  @IsOptional()
  @IsString()
  questionBankId?: string;
}

