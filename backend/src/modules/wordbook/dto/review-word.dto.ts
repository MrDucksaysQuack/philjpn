import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ReviewWordDto {
  @ApiProperty({ description: '정답 여부' })
  @IsBoolean()
  isCorrect: boolean;
}

