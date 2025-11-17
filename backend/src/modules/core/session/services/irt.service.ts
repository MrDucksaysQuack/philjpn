import { Injectable } from '@nestjs/common';

/**
 * IRT (Item Response Theory) 서비스
 * 3PL (Three-Parameter Logistic) 모델 사용
 */
@Injectable()
export class IRTService {
  /**
   * 3PL IRT 모델: P(θ) = c + (1 - c) / (1 + exp(-a(θ - b)))
   * 
   * @param ability 사용자 능력 (theta, -∞ ~ +∞, 일반적으로 -3 ~ +3)
   * @param difficulty 문제 난이도 (b, -∞ ~ +∞)
   * @param discrimination 변별도 (a, 일반적으로 0.5 ~ 2.0)
   * @param guessing 추측 확률 (c, 일반적으로 0 ~ 0.25)
   * @returns 정답 확률 (0 ~ 1)
   */
  calculateProbability(
    ability: number,
    difficulty: number,
    discrimination: number = 1.0,
    guessing: number = 0.25,
  ): number {
    const exponent = -discrimination * (ability - difficulty);
    const denominator = 1 + Math.exp(exponent);
    return guessing + (1 - guessing) / denominator;
  }

  /**
   * 능력 추정 (Maximum Likelihood Estimation)
   * 
   * @param responses 응답 배열 [{ isCorrect, difficulty, discrimination?, guessing? }]
   * @param initialAbility 초기 능력 추정값 (기본: 0)
   * @returns 추정된 능력 (theta)
   */
  estimateAbility(
    responses: Array<{
      isCorrect: boolean;
      difficulty: number;
      discrimination?: number;
      guessing?: number;
    }>,
    initialAbility: number = 0,
  ): number {
    if (responses.length === 0) {
      return initialAbility;
    }

    // Newton-Raphson 방법으로 능력 추정
    let theta = initialAbility;
    const maxIterations = 50;
    const tolerance = 0.001;

    for (let i = 0; i < maxIterations; i++) {
      const { firstDerivative, secondDerivative } = this.calculateDerivatives(
        theta,
        responses,
      );

      if (Math.abs(secondDerivative) < 1e-10) {
        break; // 분모가 너무 작으면 중단
      }

      const newTheta = theta - firstDerivative / secondDerivative;

      // 능력 범위 제한 (-3 ~ +3)
      if (newTheta < -3) {
        theta = -3;
        break;
      }
      if (newTheta > 3) {
        theta = 3;
        break;
      }

      if (Math.abs(newTheta - theta) < tolerance) {
        theta = newTheta;
        break;
      }

      theta = newTheta;
    }

    return theta;
  }

  /**
   * 로그 우도 함수의 1차 및 2차 도함수 계산
   */
  private calculateDerivatives(
    theta: number,
    responses: Array<{
      isCorrect: boolean;
      difficulty: number;
      discrimination?: number;
      guessing?: number;
    }>,
  ): { firstDerivative: number; secondDerivative: number } {
    let firstDerivative = 0;
    let secondDerivative = 0;

    for (const response of responses) {
      const discrimination = response.discrimination || 1.0;
      const guessing = response.guessing || 0.25;
      const difficulty = response.difficulty;

      const P = this.calculateProbability(theta, difficulty, discrimination, guessing);
      const Q = 1 - P;

      // P' (theta에 대한 P의 도함수)
      const dP = discrimination * (P - guessing) * (1 - P) / (1 - guessing);

      // P'' (theta에 대한 P의 2차 도함수)
      const d2P =
        discrimination *
        dP *
        (1 - 2 * P + guessing) /
        (1 - guessing);

      if (response.isCorrect) {
        firstDerivative += dP / P;
        secondDerivative += (d2P * P - dP * dP) / (P * P);
      } else {
        firstDerivative -= dP / Q;
        secondDerivative += (d2P * Q + dP * dP) / (Q * Q);
      }
    }

    return { firstDerivative, secondDerivative };
  }

  /**
   * 난이도를 능력 척도로 변환
   * 
   * @param difficulty 난이도 (easy: -1, medium: 0, hard: +1)
   * @returns IRT 난이도 (b)
   */
  convertDifficultyToIRT(difficulty: string): number {
    switch (difficulty) {
      case 'easy':
        return -1.0;
      case 'medium':
        return 0.0;
      case 'hard':
        return 1.0;
      default:
        return 0.0;
    }
  }

  /**
   * 능력을 0-1 범위로 정규화
   * 
   * @param theta IRT 능력 (-3 ~ +3)
   * @returns 정규화된 능력 (0 ~ 1)
   */
  normalizeAbility(theta: number): number {
    // 로지스틱 함수를 사용하여 0-1 범위로 변환
    return 1 / (1 + Math.exp(-theta));
  }

  /**
   * 정규화된 능력을 IRT 능력으로 변환
   * 
   * @param normalizedAbility 정규화된 능력 (0 ~ 1)
   * @returns IRT 능력 (theta)
   */
  denormalizeAbility(normalizedAbility: number): number {
    // 역 로지스틱 함수
    return Math.log(normalizedAbility / (1 - normalizedAbility));
  }
}

