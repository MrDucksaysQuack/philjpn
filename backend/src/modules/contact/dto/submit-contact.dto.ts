import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SubmitContactDto {
  @ApiProperty({ description: '이름' })
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  @MaxLength(100, { message: '이름은 100자 이하여야 합니다.' })
  name: string;

  @ApiProperty({ description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({ description: '제목' })
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  @MaxLength(200, { message: '제목은 200자 이하여야 합니다.' })
  subject: string;

  @ApiProperty({ description: '메시지' })
  @IsString()
  @IsNotEmpty({ message: '메시지를 입력해주세요.' })
  @MaxLength(5000, { message: '메시지는 5000자 이하여야 합니다.' })
  message: string;
}

