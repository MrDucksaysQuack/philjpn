import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateWordBookDto } from '../dto/create-wordbook.dto';
import { UpdateWordBookDto } from '../dto/update-wordbook.dto';
import { WordBookQueryDto } from '../dto/wordbook-query.dto';
import { ReviewWordDto } from '../dto/review-word.dto';
import { QuizRequestDto } from '../dto/quiz-request.dto';

@Injectable()
export class WordBookService {
  constructor(private prisma: PrismaService) {}

  /**
   * 단어장 목록 조회
   */
  async findAll(userId: string, query: WordBookQueryDto) {
    const { page = 1, limit = 10, difficulty, tags, masteryLevel } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (difficulty) where.difficulty = difficulty;
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }
    if (masteryLevel !== undefined) {
      where.masteryLevel = {
        gte: masteryLevel,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.wordBook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wordBook.count({ where }),
    ]);

    return {
      data: data.map((word) => ({
        id: word.id,
        word: word.word,
        meaning: word.meaning,
        example: word.example,
        difficulty: word.difficulty,
        masteryLevel: word.masteryLevel,
        reviewCount: word.reviewCount,
        nextReviewAt: word.nextReviewAt,
        tags: word.tags,
        source: word.source,
        sourceId: word.sourceId,
        createdAt: word.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 단어 상세 조회
   */
  async findOne(id: string, userId: string) {
    const word = await this.prisma.wordBook.findUnique({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException(`단어를 찾을 수 없습니다. ID: ${id}`);
    }

    if (word.userId !== userId) {
      throw new ForbiddenException('본인의 단어만 조회할 수 있습니다.');
    }

    return word;
  }

  /**
   * 단어 추가
   */
  async create(userId: string, createDto: CreateWordBookDto) {
    // 중복 확인 (같은 사용자의 같은 단어)
    const existing = await this.prisma.wordBook.findFirst({
      where: {
        userId,
        word: createDto.word,
      },
    });

    if (existing) {
      throw new BadRequestException('이미 등록된 단어입니다.');
    }

    const word = await this.prisma.wordBook.create({
      data: {
        userId,
        word: createDto.word,
        meaning: createDto.meaning,
        example: createDto.example,
        difficulty: createDto.difficulty || 'medium',
        tags: createDto.tags || [],
        source: createDto.source,
        sourceId: createDto.sourceId,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: new Date(), // 처음에는 즉시 복습 가능
      },
    });

    return word;
  }

  /**
   * 단어 수정
   */
  async update(id: string, userId: string, updateDto: UpdateWordBookDto) {
    const word = await this.prisma.wordBook.findUnique({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException(`단어를 찾을 수 없습니다. ID: ${id}`);
    }

    if (word.userId !== userId) {
      throw new ForbiddenException('본인의 단어만 수정할 수 있습니다.');
    }

    const updatedWord = await this.prisma.wordBook.update({
      where: { id },
      data: updateDto,
    });

    return updatedWord;
  }

  /**
   * 단어 삭제
   */
  async remove(id: string, userId: string) {
    const word = await this.prisma.wordBook.findUnique({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException(`단어를 찾을 수 없습니다. ID: ${id}`);
    }

    if (word.userId !== userId) {
      throw new ForbiddenException('본인의 단어만 삭제할 수 있습니다.');
    }

    await this.prisma.wordBook.delete({
      where: { id },
    });

    return { message: '단어가 삭제되었습니다.' };
  }

  /**
   * 단어 복습 기록 (SRS 알고리즘)
   */
  async recordReview(id: string, userId: string, reviewDto: ReviewWordDto) {
    const word = await this.prisma.wordBook.findUnique({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException(`단어를 찾을 수 없습니다. ID: ${id}`);
    }

    if (word.userId !== userId) {
      throw new ForbiddenException('본인의 단어만 복습할 수 있습니다.');
    }

    const { isCorrect } = reviewDto;
    const currentMasteryLevel = word.masteryLevel;
    const currentReviewCount = word.reviewCount;

    // 향상된 SRS 알고리즘 (SM-2 기반)
    // Easiness Factor 계산
    const currentEF = currentMasteryLevel > 0 ? 2.5 - (100 - currentMasteryLevel) / 100 : 2.5;
    
    // 현재 간격 계산
    const lastReview = word.lastReviewedAt || word.createdAt;
    const daysSinceLastReview = Math.floor(
      (new Date().getTime() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentInterval = Math.max(0, daysSinceLastReview);

    let newEF = currentEF;
    let newInterval = currentInterval;
    let newMasteryLevel: number;

    if (isCorrect) {
      // 정답 시: EF 증가 (최소 1.3), 간격 증가, 숙련도 증가
      newEF = Math.max(1.3, currentEF + 0.1);
      
      if (currentInterval === 0) {
        newInterval = 1; // 첫 복습: 다음날
      } else if (currentInterval === 1) {
        newInterval = 6; // 두 번째: 6일 후
      } else {
        newInterval = Math.floor(currentInterval * newEF);
      }
      
      newMasteryLevel = Math.min(100, currentMasteryLevel + Math.max(1, Math.floor(10 / (currentInterval + 1))));
    } else {
      // 오답 시: EF 감소, 간격 초기화, 숙련도 감소
      newEF = Math.max(1.3, currentEF - 0.2);
      newInterval = 0; // 즉시 재복습
      newMasteryLevel = Math.max(0, currentMasteryLevel - 10);
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

    const updatedWord = await this.prisma.wordBook.update({
      where: { id },
      data: {
        masteryLevel: newMasteryLevel,
        reviewCount: currentReviewCount + 1,
        nextReviewAt,
        lastReviewedAt: new Date(),
      },
    });

    return {
      masteryLevel: updatedWord.masteryLevel,
      reviewCount: updatedWord.reviewCount,
      nextReviewAt: updatedWord.nextReviewAt,
      interval: newInterval,
      easinessFactor: newEF,
    };
  }

  /**
   * 복습할 단어 목록 조회 (SRS 기반)
   */
  async getReviewList(userId: string, limit: number = 20) {
    const now = new Date();

    const words = await this.prisma.wordBook.findMany({
      where: {
        userId,
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null },
        ],
      },
      take: limit,
      orderBy: [
        { nextReviewAt: 'asc' },
        { masteryLevel: 'asc' },
      ],
    });

    return {
      data: words.map((word) => ({
        id: word.id,
        word: word.word,
        meaning: word.meaning,
        example: word.example,
        masteryLevel: word.masteryLevel,
        nextReviewAt: word.nextReviewAt,
      })),
    };
  }

  /**
   * 퀴즈 모드
   */
  async generateQuiz(userId: string, quizDto: QuizRequestDto) {
    const { count, tags, difficulty } = quizDto;

    const where: any = {
      userId,
    };

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // 퀴즈용 단어 목록 가져오기
    const words = await this.prisma.wordBook.findMany({
      where,
      take: count * 3, // 옵션 생성용 여유
    });

    if (words.length < count) {
      throw new BadRequestException(
        `요청한 문제 수(${count})보다 등록된 단어가 적습니다.`,
      );
    }

    // 랜덤하게 count개 선택
    const selectedWords = this.shuffleArray(words).slice(0, count);

    // 각 단어에 대한 선택지 생성
    const questions = await Promise.all(
      selectedWords.map(async (word, index) => {
        // 정답을 제외한 다른 단어들의 의미를 선택지로 사용
        const otherMeanings = words
          .filter((w) => w.id !== word.id)
          .map((w) => w.meaning);
        const shuffledMeanings = this.shuffleArray(otherMeanings).slice(0, 3);
        const options = [
          word.meaning, // 정답
          ...shuffledMeanings,
        ];
        const shuffledOptions = this.shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(word.meaning);

        return {
          id: word.id,
          word: word.word,
          example: word.example,
          options: shuffledOptions,
          correctIndex,
        };
      }),
    );

    return { questions };
  }

  /**
   * 배열 셔플 (Fisher-Yates 알고리즘)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

