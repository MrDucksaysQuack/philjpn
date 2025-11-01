#!/bin/bash

# Exam Platform 개발 서버 동시 실행 스크립트

echo "🚀 Starting Exam Platform Development Servers..."
echo ""

# 백엔드 실행 (백그라운드)
echo "📦 Starting Backend Server..."
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 잠시 대기 (백엔드 시작 시간 확보)
sleep 3

# 프론트엔드 실행 (백그라운드)
echo "🎨 Starting Frontend Server..."
cd frontend/client
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# 종료 처리 함수
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit
}

# Ctrl+C 트랩 설정
trap cleanup INT TERM

echo ""
echo "✅ Backend: http://localhost:3001"
echo "✅ Backend API Docs: http://localhost:3001/api-docs"
echo "✅ Frontend: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# 대기 (프로세스 유지)
wait

