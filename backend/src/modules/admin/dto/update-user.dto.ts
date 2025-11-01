import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/types';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: '이름' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: UserRole, description: '역할' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '활성화 여부' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '이메일 인증 여부' })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}

