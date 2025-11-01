import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionQueryDto {
  @ApiPropertyOptional({
    description: '정답 및 해설 포함 여부',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeAnswer?: boolean = false;
}

