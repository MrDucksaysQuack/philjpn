import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType, Difficulty } from '../../../../common/types';

export class ExamConfigDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowSectionNavigation?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowQuestionReview?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showAnswerAfterSubmit?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showScoreImmediately?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  timeLimitPerSection?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  preventTabSwitch?: boolean;
}

export class CreateExamDto {
  @ApiProperty({ description: '시험 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '시험 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ExamType, description: '시험 유형' })
  @IsEnum(ExamType)
  @IsNotEmpty()
  examType: ExamType;

  @ApiPropertyOptional({ description: '과목 (예: 토익, 토플)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ enum: Difficulty, description: '난이도' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ description: '예상 소요 시간 (분)' })
  @IsOptional()
  @IsNumber()
  estimatedTime?: number;

  @ApiPropertyOptional({ description: '합격 점수' })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({ default: false, description: '공개 여부' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: ExamConfigDto, description: '시험 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExamConfigDto)
  config?: ExamConfigDto;
}

