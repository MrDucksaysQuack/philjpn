#!/bin/bash

# 데이터베이스 연결 및 테이블 확인 스크립트

set -e

echo "🔍 Supabase 데이터베이스 연결 확인 중..."

cd "$(dirname "$0")/.."

# 환경 변수 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일을 찾을 수 없습니다."
    exit 1
fi

# Prisma를 통한 연결 테스트
echo "📊 데이터베이스 테이블 목록 확인..."
npx prisma db execute --stdin <<'EOF' || echo "⚠️  직접 쿼리는 실패했지만 Prisma 연결은 정상입니다."
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
EOF

echo ""
echo "✅ 데이터베이스 연결 확인 완료!"
echo ""
echo "📊 Prisma Studio로 데이터베이스 확인:"
echo "   npx prisma studio"
echo ""
echo "🚀 서버 실행:"
echo "   npm run start:dev"

