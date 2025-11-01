import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SaveAnswerDto {
  @ApiProperty({ description: '문제 ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: '사용자 답안' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

