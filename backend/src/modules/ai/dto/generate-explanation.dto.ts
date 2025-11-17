import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class GenerateExplanationDto {
  @ApiProperty({ description: '문제 ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: '사용자 답안' })
  @IsString()
  @IsNotEmpty()
  userAnswer: string;

  @ApiProperty({ description: '정답 여부' })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}

