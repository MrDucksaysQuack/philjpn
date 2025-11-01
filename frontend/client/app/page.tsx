'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function HomePage() {
  return (
    <>
      <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  온라인 시험 플랫폼
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
                  언제 어디서나 편리하게 시험을 응시하고 학습하세요
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:space-x-4 px-4">
                  <Link
                    href="/exams"
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md text-base sm:text-lg font-medium hover:bg-blue-700 text-center"
                  >
                    시험 시작하기
                  </Link>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-md text-base sm:text-lg font-medium hover:bg-blue-50 text-center"
                  >
                    회원가입
                  </Link>
                </div>
              </div>

              <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">실시간 시험</h3>
            <p className="text-gray-600">
              실제 시험 환경과 동일한 조건에서 실전 연습이 가능합니다
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">상세 분석</h3>
            <p className="text-gray-600">
              시험 결과를 분석하여 약점을 파악하고 개선할 수 있습니다
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">학습 도구</h3>
            <p className="text-gray-600">
              단어장과 복습 시스템으로 효율적인 학습이 가능합니다
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
