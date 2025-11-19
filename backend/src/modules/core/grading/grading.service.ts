import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { QuestionStatisticsService } from '../../admin/services/question-statistics.service';

@Injectable()
export class GradingService {
  constructor(
    private prisma: PrismaService,
    private questionStatisticsService: QuestionStatisticsService,
  ) {}

  /**
   * 시험 채점
   * @param examResultId 시험 결과 ID
   */
  async gradeExam(examResultId: string) {
    const examResult = await this.prisma.examResult.findUnique({
      where: { id: examResultId },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!examResult) {
      throw new Error(`시험 결과를 찾을 수 없습니다. ID: ${examResultId}`);
    }

    const session = await this.prisma.userExamSession.findFirst({
      where: { examResultId },
    });

    if (!session) {
      throw new Error(`시험 세션을 찾을 수 없습니다.`);
    }

    const answers = session.answers as Record<string, string>;

    // 섹션별 채점
    const sectionResults: any[] = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const section of examResult.exam.sections) {
      const sectionResult = await this.gradeSection(
        examResultId,
        section.id,
        section.questions,
        answers,
      );
      sectionResults.push(sectionResult);
      totalScore += sectionResult.score || 0;
      maxScore += sectionResult.maxScore || 0;
    }

    // 시험 결과 업데이트
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const examResultWithSubmittedAt = await this.prisma.examResult.findUnique({
      where: { id: examResultId },
      select: { submittedAt: true },
    });
    const submittedAt = examResultWithSubmittedAt?.submittedAt;

    const timeSpent = submittedAt
      ? Math.floor(
          (new Date(submittedAt).getTime() -
            new Date(examResult.startedAt).getTime()) /
            1000,
        )
      : null;

    const updatedExamResult = await this.prisma.examResult.update({
      where: { id: examResultId },
      data: {
        status: 'graded',
        totalScore,
        maxScore,
        percentage: percentage.toFixed(2),
        gradedAt: new Date(),
      },
    });

    return {
      ...updatedExamResult,
      sectionResults,
    };
  }

  /**
   * 섹션 채점
   */
  private async gradeSection(
    examResultId: string,
    sectionId: string,
    questions: any[],
    answers: Record<string, string>,
  ) {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let score = 0;
    let maxScore = 0;

    // 섹션 결과 생성
    const sectionResult = await this.prisma.sectionResult.create({
      data: {
        examResultId,
        sectionId,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        score: 0,
        maxScore: 0,
      },
    });

    // 문항별 채점
    for (const question of questions) {
      const userAnswer = answers[question.id] || null;
      const isCorrect = userAnswer === question.correctAnswer;
      const pointsPossible = question.points || 1;
      const pointsEarned = isCorrect ? pointsPossible : 0;

      await this.prisma.questionResult.create({
        data: {
          sectionResultId: sectionResult.id,
          questionId: question.id,
          userAnswer,
          isCorrect,
          pointsEarned,
          pointsPossible,
        },
      });

      // 문제 통계 업데이트 (비동기)
      this.questionStatisticsService.updateStatisticsOnResult(question.id);

      // 통계 업데이트
      if (!userAnswer) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
        score += pointsEarned;
      } else {
        incorrectCount++;
      }

      maxScore += pointsPossible;
    }

    // 섹션 결과 업데이트
    const updatedSectionResult = await this.prisma.sectionResult.update({
      where: { id: sectionResult.id },
      data: {
        correctCount,
        incorrectCount,
        unansweredCount,
        score,
        maxScore,
      },
    });

    return updatedSectionResult;
  }
}

