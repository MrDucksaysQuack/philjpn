/**
 * 유틸리티 함수 모음
 */

/**
 * 클래스명 병합 함수
 * clsx와 유사한 기능을 제공합니다.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

