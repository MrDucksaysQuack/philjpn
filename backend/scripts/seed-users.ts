/**
 * 개발 환경용 테스트 사용자 생성 스크립트
 * 
 * 사용법:
 *   npx ts-node scripts/seed-users.ts
 * 
 * 또는 package.json에 스크립트 추가 후:
 *   npm run seed:users
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test users...\n');

  // 비밀번호 해시 (기본: password123)
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 일반 사용자 계정
  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {
      role: 'user', // 기존 계정도 role 업데이트
    },
    create: {
      email: 'user@test.com',
      password: hashedPassword,
      name: '테스트 사용자',
      role: 'user',
      phone: '010-1234-5678',
      isActive: true,
      isEmailVerified: false,
    },
  });

  // Admin 계정
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      role: 'admin', // 기존 계정도 role 업데이트
    },
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: '관리자',
      role: 'admin',
      phone: '010-9999-9999',
      isActive: true,
      isEmailVerified: false,
    },
  });

  console.log('✅ Test users created:\n');
  console.log('📧 일반 사용자:');
  console.log('   Email: user@test.com');
  console.log('   Password: password123');
  console.log('   Role: user\n');

  console.log('👑 Admin 사용자:');
  console.log('   Email: admin@test.com');
  console.log('   Password: password123');
  console.log('   Role: admin\n');

  console.log('🔗 Login URLs:');
  console.log('   User: http://localhost:3000/login');
  console.log('   Admin: http://localhost:3000/login (then go to /admin)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

