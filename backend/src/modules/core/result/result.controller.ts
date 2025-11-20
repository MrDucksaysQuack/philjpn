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
  async findAll(@Query() query: ResultQueryDto, @CurrentUser() user: any) {
    try {
      return await this.resultService.findAll(user.id, query);
    } catch (error: any) {
      console.error('❌ findAll (ResultController) 에러:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
        userId: user?.id,
        query,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 결과 상세 조회' })
  @ApiResponse({ status: 200, description: '시험 결과 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '시험 결과를 찾을 수 없음' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      return await this.resultService.findOne(id, user.id);
    } catch (error: any) {
      console.error('❌ findOne (ResultController) 에러:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
        userId: user?.id,
        resultId: id,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

