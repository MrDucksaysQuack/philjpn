import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WordBookService } from './services/wordbook.service';
import { WordExtractionService } from './services/word-extraction.service';
import { CreateWordBookDto } from './dto/create-wordbook.dto';
import { UpdateWordBookDto } from './dto/update-wordbook.dto';
import { WordBookQueryDto } from './dto/wordbook-query.dto';
import { ReviewWordDto } from './dto/review-word.dto';
import { QuizRequestDto } from './dto/quiz-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Word Books')
@Controller('api/word-books')
export class WordBookController {
  constructor(
    private readonly wordBookService: WordBookService,
    private readonly wordExtractionService: WordExtractionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 단어장 목록' })
  @ApiResponse({ status: 200, description: '단어장 목록 조회 성공' })
  findAll(@Query() query: WordBookQueryDto, @CurrentUser() user: any) {
    return this.wordBookService.findAll(user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어 상세 조회' })
  @ApiResponse({ status: 200, description: '단어 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '단어를 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.wordBookService.findOne(id, user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어 추가' })
  @ApiResponse({ status: 201, description: '단어 추가 성공' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateWordBookDto, @CurrentUser() user: any) {
    return this.wordBookService.create(user.id, createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어 수정' })
  @ApiResponse({ status: 200, description: '단어 수정 성공' })
  @ApiResponse({ status: 404, description: '단어를 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWordBookDto,
    @CurrentUser() user: any,
  ) {
    return this.wordBookService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어 삭제' })
  @ApiResponse({ status: 200, description: '단어 삭제 성공' })
  @ApiResponse({ status: 404, description: '단어를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.wordBookService.remove(id, user.id);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어 복습 기록' })
  @ApiResponse({ status: 200, description: '복습 기록 성공' })
  @ApiResponse({ status: 404, description: '단어를 찾을 수 없음' })
  recordReview(
    @Param('id') id: string,
    @Body() reviewDto: ReviewWordDto,
    @CurrentUser() user: any,
  ) {
    return this.wordBookService.recordReview(id, user.id, reviewDto);
  }

  @Get('review-list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '복습할 단어 목록 (SRS 기반)' })
  @ApiResponse({ status: 200, description: '복습 목록 조회 성공' })
  getReviewList(
    @Query('limit') limit: number = 20,
    @CurrentUser() user: any,
  ) {
    return this.wordBookService.getReviewList(user.id, limit);
  }

  @Post('quiz')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어 퀴즈 모드' })
  @ApiResponse({ status: 200, description: '퀴즈 생성 성공' })
  generateQuiz(@Body() quizDto: QuizRequestDto, @CurrentUser() user: any) {
    return this.wordBookService.generateQuiz(user.id, quizDto);
  }

  // 시험 결과에서 단어 추출
  @Post('extract-from-result/:examResultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 결과에서 단어 추출' })
  @ApiResponse({ status: 200, description: '단어 추출 성공' })
  extractWordsFromResult(
    @Param('examResultId') examResultId: string,
    @CurrentUser() user: any,
  ) {
    return this.wordExtractionService.extractWordsFromResult(examResultId, user.id);
  }

  @Post('add-extracted')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '추출된 단어 일괄 추가' })
  @ApiResponse({ status: 201, description: '단어 일괄 추가 성공' })
  addExtractedWords(
    @Body() words: Array<{
      word: string;
      meaning: string;
      context?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      source?: string;
      sourceId?: string;
      tags?: string[];
    }>,
    @CurrentUser() user: any,
  ) {
    return this.wordExtractionService.addExtractedWords(user.id, words);
  }
}

