/**
 * 시험 완료 이벤트
 * 시험이 완료되고 채점이 끝난 후 발행됩니다.
 */
export class ExamCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly examResultId: string,
    public readonly examId: string,
    public readonly score: number,
    public readonly maxScore: number,
    public readonly percentage: number,
    public readonly categoryId?: string,
    public readonly timeSpent?: number,
  ) {}
}

