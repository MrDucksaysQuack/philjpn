import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { AIAnalysisService } from './ai-analysis.service';
import { PrismaService } from '../../../common/utils/prisma.service';

export interface ExplanationJobData {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  questionResultId?: string;
}

export interface WeaknessDiagnosisJobData {
  examResultId: string;
}

@Injectable()
export class AIQueueService implements OnModuleInit {
  private readonly logger = new Logger(AIQueueService.name);

  constructor(
    @InjectQueue('ai-analysis') private aiQueue: Queue,
    private aiAnalysisService: AIAnalysisService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    // 해설 생성 작업 처리
    this.aiQueue.process('generate-explanation', async (job: Job<ExplanationJobData>) => {
      this.logger.debug(`Processing explanation job ${job.id} for question ${job.data.questionId}`);
      
      try {
        const explanation = await this.aiAnalysisService.generateExplanation(
          job.data.questionId,
          job.data.userAnswer,
          job.data.isCorrect,
        );

        // QuestionResult에 저장 (제공된 경우)
        if (job.data.questionResultId) {
          await this.prisma.questionResult.update({
            where: { id: job.data.questionResultId },
            data: {
              aiExplanation: explanation,
              aiGeneratedAt: new Date(),
            },
          });
        }

        return { explanation, success: true };
      } catch (error) {
        this.logger.error(`Explanation job ${job.id} failed:`, error);
        throw error;
      }
    });

    // 약점 진단 작업 처리
    this.aiQueue.process('diagnose-weakness', async (job: Job<WeaknessDiagnosisJobData>) => {
      this.logger.debug(`Processing weakness diagnosis job ${job.id} for exam result ${job.data.examResultId}`);
      
      try {
        const diagnosis = await this.aiAnalysisService.diagnoseWeakness(
          job.data.examResultId,
        );

        // ExamResult에 저장
        await this.prisma.examResult.update({
          where: { id: job.data.examResultId },
          data: {
            aiAnalysis: diagnosis as any,
            aiAnalyzedAt: new Date(),
          },
        });

        return { diagnosis, success: true };
      } catch (error) {
        this.logger.error(`Weakness diagnosis job ${job.id} failed:`, error);
        throw error;
      }
    });
  }

  /**
   * 해설 생성 작업 큐에 추가
   */
  async enqueueExplanation(
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
    questionResultId?: string,
  ): Promise<Job<ExplanationJobData>> {
    const job = await this.aiQueue.add('generate-explanation', {
      questionId,
      userAnswer,
      isCorrect,
      questionResultId,
    } as ExplanationJobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.debug(`Enqueued explanation job ${job.id} for question ${questionId}`);
    return job;
  }

  /**
   * 약점 진단 작업 큐에 추가
   */
  async enqueueWeaknessDiagnosis(examResultId: string): Promise<Job<WeaknessDiagnosisJobData>> {
    const job = await this.aiQueue.add('diagnose-weakness', {
      examResultId,
    } as WeaknessDiagnosisJobData, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.debug(`Enqueued weakness diagnosis job ${job.id} for exam result ${examResultId}`);
    return job;
  }

  /**
   * 작업 상태 조회
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.aiQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  }

  /**
   * 큐 통계 조회
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.aiQueue.getWaitingCount(),
      this.aiQueue.getActiveCount(),
      this.aiQueue.getCompletedCount(),
      this.aiQueue.getFailedCount(),
      this.aiQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}

