import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResultService } from './result.service';
import { ResultQueryDto } from './dto/result-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Exam Results')
@Controller('api/results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 시험 결과 목록' })
  @ApiResponse({ status: 200, description: '시험 결과 목록 조회 성공' })
  findAll(@Query() query: ResultQueryDto, @CurrentUser() user: any) {
    return this.resultService.findAll(user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 결과 상세 조회' })
  @ApiResponse({ status: 200, description: '시험 결과 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '시험 결과를 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resultService.findOne(id, user.id);
  }
}

