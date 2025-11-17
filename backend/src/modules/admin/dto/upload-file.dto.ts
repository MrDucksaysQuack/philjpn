import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({ description: '업로드된 파일의 URL' })
  url: string;

  @ApiProperty({ description: '파일명' })
  filename: string;

  @ApiProperty({ description: '파일 크기 (bytes)' })
  size: number;
}

