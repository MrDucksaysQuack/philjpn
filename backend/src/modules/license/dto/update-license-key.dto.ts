import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateLicenseKeyDto } from './create-license-key.dto';

export class UpdateLicenseKeyDto extends PartialType(CreateLicenseKeyDto) {
  @ApiPropertyOptional({ description: '활성화 여부' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

