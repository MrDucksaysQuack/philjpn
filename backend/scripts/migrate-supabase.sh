#!/bin/bash

# Supabase 마이그레이션 스크립트
# 사용법: ./scripts/migrate-supabase.sh

set -e  # 오류 발생 시 중단

echo "🚀 Supabase 마이그레이션 시작..."

# 환경 변수 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일을 찾을 수 없습니다."
    echo "📝 .env.example을 참고하여 .env 파일을 생성하세요."
    exit 1
fi

# DATABASE_URL 확인
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ .env 파일에 DATABASE_URL이 없습니다."
    echo "📝 Supabase 연결 문자열을 추가하세요."
    exit 1
fi

echo "✅ 환경 변수 확인 완료"

# Prisma Client 생성
echo "📦 Prisma Client 생성 중..."
npx prisma generate

# 마이그레이션 적용 (프로덕션 모드)
echo "🗄️  데이터베이스 마이그레이션 적용 중..."
npx prisma migrate deploy

echo "✅ 마이그레이션 완료!"
echo ""
echo "📊 데이터베이스 구조 확인: npx prisma studio"
echo "🚀 서버 실행: npm run start:dev"

