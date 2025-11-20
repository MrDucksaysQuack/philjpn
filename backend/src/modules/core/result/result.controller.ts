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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      const context = '[findAll-ResultController]';
      
      // Winston + console + stderr 병행 (Railway 환경 대응)
      console.error(`${context}`, {
        code: errorCode,
        msg: errorMessage,
        stack: errorStack,
        userId: user?.id,
        query,
        time: new Date().toISOString(),
      });
      // Railway가 인식할 수 있도록 stderr에 직접 출력
      process.stderr.write(
        `[ERROR] ${context} ${errorMessage}\n` +
        `Code: ${errorCode || 'N/A'}\n` +
        `UserId: ${user?.id || 'N/A'}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Stack: ${errorStack || 'N/A'}\n\n`,
      );
      
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      const context = '[findOne-ResultController]';
      
      // Winston + console 병행
      console.error(`${context}`, {
        code: errorCode,
        msg: errorMessage,
        stack: errorStack,
        userId: user?.id,
        resultId: id,
        time: new Date().toISOString(),
      });
      
      throw error;
    }
  }
}

