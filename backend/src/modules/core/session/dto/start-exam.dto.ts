import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StartExamDto {
  @ApiPropertyOptional({ description: '라이선스 키 (Phase 4에서 필수화)' })
  @IsOptional()
  @IsString()
  licenseKey?: string;
}

