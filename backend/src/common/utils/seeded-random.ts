/**
 * 시드 기반 의사 난수 생성기
 * Linear Congruential Generator (LCG) 알고리즘 사용
 * 동일한 시드로 동일한 난수 시퀀스 생성 보장
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * 0과 1 사이의 난수 생성
   */
  next(): number {
    // LCG 알고리즘: (a * seed + c) % m
    // a = 1664525, c = 1013904223, m = 2^32
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /**
   * min과 max 사이의 정수 난수 생성
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * 배열을 시드 기반으로 셔플
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

