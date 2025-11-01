import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지 크기' })
  limit: number;

  @ApiProperty({ description: '전체 항목 수' })
  total: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '데이터 배열' })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto, description: '페이징 메타 정보' })
  meta: PaginationMetaDto;
}

