/**
 * 전체 테이블 샘플 데이터 생성 스크립트
 * 
 * 사용법:
 *   npx ts-node scripts/seed-all.ts
 * 
 * 또는 package.json에 스크립트 추가 후:
 *   npm run seed:all
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const ADMIN_USER_ID = '044bf1f9-e0b3-43f9-9cca-8a767db1cde6';

async function main() {
  console.log('🌱 Creating sample data for all tables...\n');

  // 1. Admin 사용자 확인 (이미 존재하는지 확인)
  const adminUser = await prisma.user.findUnique({
    where: { id: ADMIN_USER_ID },
  });

  if (!adminUser) {
    console.log('⚠️  Admin user not found. Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'admin@example.com',
        password: hashedPassword,
        name: '관리자',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log('✅ Admin user created\n');
  } else {
    console.log('✅ Admin user already exists\n');
  }

  // 2. 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: '테스트 사용자',
      role: 'user',
      phone: '010-1234-5678',
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    },
  });
  console.log('✅ Test user created:', testUser.email);

  // 3. Question Bank 생성
  let questionBank = await prisma.questionBank.findFirst({
    where: { name: '기본 문제 은행' },
  });
  if (!questionBank) {
    questionBank = await prisma.questionBank.create({
      data: {
        name: '기본 문제 은행',
        description: '토익 기초 문제 모음',
        category: 'TOEIC',
        createdBy: ADMIN_USER_ID,
      },
    });
  }
  console.log('✅ Question Bank created:', questionBank.name);

  // 4. Exam 생성
  const exam1 = await prisma.exam.create({
    data: {
      title: '2024년 토익 모의고사 #1',
      description: '토익 실전 모의고사입니다. 총 200문제, 120분 소요 예상.',
      examType: 'mock',
      subject: 'TOEIC',
      difficulty: 'medium',
      totalQuestions: 200,
      totalSections: 7,
      estimatedTime: 120,
      passingScore: 600,
      isActive: true,
      isPublic: true,
      publishedAt: new Date(),
      createdBy: ADMIN_USER_ID,
    },
  });
  console.log('✅ Exam created:', exam1.title);

  const exam2 = await prisma.exam.create({
    data: {
      title: '토익 LC 연습시험',
      description: '토익 Listening Comprehension 연습용 시험',
      examType: 'practice',
      subject: 'TOEIC',
      difficulty: 'easy',
      totalQuestions: 100,
      totalSections: 4,
      estimatedTime: 45,
      passingScore: 400,
      isActive: true,
      isPublic: true,
      publishedAt: new Date(),
      createdBy: ADMIN_USER_ID,
    },
  });
  console.log('✅ Exam created:', exam2.title);

  // 5. Exam Config 생성
  await prisma.examConfig.createMany({
    data: [
      {
        examId: exam1.id,
        allowSectionNavigation: true,
        allowQuestionReview: true,
        showAnswerAfterSubmit: true,
        showScoreImmediately: true,
        timeLimitPerSection: false,
        shuffleQuestions: false,
        shuffleOptions: false,
        preventTabSwitch: true,
      },
      {
        examId: exam2.id,
        allowSectionNavigation: true,
        allowQuestionReview: true,
        showAnswerAfterSubmit: true,
        showScoreImmediately: false,
        timeLimitPerSection: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        preventTabSwitch: false,
      },
    ],
  });
  console.log('✅ Exam Configs created');

  // 6. Sections 생성 (Exam 1)
  const section1_1 = await prisma.section.create({
    data: {
      examId: exam1.id,
      title: 'Part 1: 사진 묘사',
      description: '사진을 보고 적절한 설명을 선택하세요',
      order: 1,
      questionCount: 6,
      timeLimit: 600,
    },
  });

  const section1_2 = await prisma.section.create({
    data: {
      examId: exam1.id,
      title: 'Part 2: 질문-응답',
      description: '질문에 적절한 응답을 선택하세요',
      order: 2,
      questionCount: 25,
      timeLimit: 1800,
    },
  });

  const section1_3 = await prisma.section.create({
    data: {
      examId: exam1.id,
      title: 'Part 3: 짧은 대화',
      description: '짧은 대화를 듣고 문제를 풀어보세요',
      order: 3,
      questionCount: 39,
      timeLimit: 2700,
    },
  });

  console.log('✅ Sections created for Exam 1');

  // 7. Sections 생성 (Exam 2)
  const section2_1 = await prisma.section.create({
    data: {
      examId: exam2.id,
      title: 'Part 1: 사진 묘사',
      order: 1,
      questionCount: 6,
      timeLimit: 600,
    },
  });

  const section2_2 = await prisma.section.create({
    data: {
      examId: exam2.id,
      title: 'Part 2: 질문-응답',
      order: 2,
      questionCount: 25,
      timeLimit: 1800,
    },
  });

  console.log('✅ Sections created for Exam 2');

  // 8. Questions 생성
  const questions1: any[] = [];
  for (let i = 1; i <= 6; i++) {
    questions1.push({
      sectionId: section1_1.id,
      questionBankId: questionBank.id,
      questionNumber: i,
      questionType: 'multiple_choice' as const,
      content: `Part 1 문제 ${i}: 사진을 보고 적절한 설명을 선택하세요.`,
      options: ['A) 사진 설명 A', 'B) 사진 설명 B', 'C) 사진 설명 C', 'D) 사진 설명 D'],
      correctAnswer: 'A',
      explanation: `Part 1 문제 ${i}의 정답 설명입니다.`,
      points: 1,
      difficulty: 'easy' as const,
      tags: ['TOEIC', 'LC', 'Part1'],
    });
  }
  await prisma.question.createMany({ data: questions1 });
  console.log('✅ Questions created for Section 1 (6 questions)');

  const questions2: any[] = [];
  for (let i = 1; i <= 5; i++) {
    questions2.push({
      sectionId: section1_2.id,
      questionBankId: questionBank.id,
      questionNumber: i,
      questionType: 'multiple_choice' as const,
      content: `Part 2 문제 ${i}: 다음 질문에 적절한 응답을 선택하세요.`,
      options: ['A) 응답 A', 'B) 응답 B', 'C) 응답 C'],
      correctAnswer: 'B',
      explanation: `Part 2 문제 ${i}의 정답 설명입니다.`,
      points: 1,
      difficulty: 'medium' as const,
      tags: ['TOEIC', 'LC', 'Part2'],
    });
  }
  await prisma.question.createMany({ data: questions2 });
  console.log('✅ Questions created for Section 2 (5 questions)');

  // 9. License Keys 생성
  const licenseKey1 = await prisma.licenseKey.create({
    data: {
      key: generateLicenseKey(),
      keyType: 'ACCESS_KEY',
      examIds: [exam1.id, exam2.id],
      usageLimit: 10,
      usageCount: 3,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후
      isActive: true,
      issuedBy: ADMIN_USER_ID,
    },
  });

  const licenseKey2 = await prisma.licenseKey.create({
    data: {
      userId: testUser.id,
      key: generateLicenseKey(),
      keyType: 'TEST_KEY',
      examIds: [exam1.id],
      usageLimit: 5,
      usageCount: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      isActive: true,
      issuedBy: ADMIN_USER_ID,
    },
  });
  console.log('✅ License Keys created');

  // 10. Word Books 생성
  const words = [
    {
      userId: testUser.id,
      word: 'abandon',
      meaning: '포기하다',
      example: 'He had to abandon his car due to the accident.',
      difficulty: 'medium' as const,
      source: 'TOEIC',
      masteryLevel: 60,
      reviewCount: 5,
      lastReviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags: ['TOEIC', 'vocabulary'],
    },
    {
      userId: testUser.id,
      word: 'ability',
      meaning: '능력',
      example: 'She has the ability to speak multiple languages.',
      difficulty: 'easy' as const,
      source: 'TOEIC',
      masteryLevel: 85,
      reviewCount: 8,
      lastReviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      tags: ['TOEIC', 'vocabulary'],
    },
    {
      userId: testUser.id,
      word: 'accomplish',
      meaning: '성취하다',
      example: 'We need to accomplish our goals by the end of the month.',
      difficulty: 'hard' as const,
      source: 'TOEIC',
      masteryLevel: 30,
      reviewCount: 2,
      lastReviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(),
      tags: ['TOEIC', 'vocabulary'],
    },
  ];
  await prisma.wordBook.createMany({ data: words });
  console.log('✅ Word Books created (3 words)');

  // 11. Exam Results 생성
  const examResult1 = await prisma.examResult.create({
    data: {
      userId: testUser.id,
      examId: exam1.id,
      licenseKeyId: licenseKey1.id,
      status: 'completed',
      totalScore: 750,
      maxScore: 990,
      percentage: 75.76,
      timeSpent: 7200, // 120분
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 7200 * 1000),
      gradedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    },
  });

  const examResult2 = await prisma.examResult.create({
    data: {
      userId: testUser.id,
      examId: exam2.id,
      licenseKeyId: licenseKey2.id,
      status: 'in_progress',
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1시간 전
    },
  });
  console.log('✅ Exam Results created');

  // 12. Section Results 생성
  const sectionResult1 = await prisma.sectionResult.create({
    data: {
      examResultId: examResult1.id,
      sectionId: section1_1.id,
      correctCount: 5,
      incorrectCount: 1,
      unansweredCount: 0,
      score: 5,
      maxScore: 6,
      timeSpent: 600,
    },
  });

  const sectionResult2 = await prisma.sectionResult.create({
    data: {
      examResultId: examResult1.id,
      sectionId: section1_2.id,
      correctCount: 4,
      incorrectCount: 1,
      unansweredCount: 0,
      score: 4,
      maxScore: 5,
      timeSpent: 900,
    },
  });
  console.log('✅ Section Results created');

  // 13. Question Results 생성
  const questionResults: any[] = [];
  const allQuestions = await prisma.question.findMany({
    where: {
      sectionId: {
        in: [section1_1.id, section1_2.id],
      },
    },
  });

  // Section 1 질문 결과
  const section1Questions = allQuestions.filter(q => q.sectionId === section1_1.id);
  for (let i = 0; i < section1Questions.length; i++) {
    const q = section1Questions[i];
    questionResults.push({
      sectionResultId: sectionResult1.id,
      questionId: q.id,
      userAnswer: i === 2 ? 'B' : 'A', // 3번째 문제만 틀림
      isCorrect: i !== 2,
      pointsEarned: i !== 2 ? 1 : 0,
      pointsPossible: 1,
      timeSpent: 100,
      answeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + i * 100 * 1000),
    });
  }

  // Section 2 질문 결과
  const section2Questions = allQuestions.filter(q => q.sectionId === section1_2.id);
  for (let i = 0; i < section2Questions.length; i++) {
    const q = section2Questions[i];
    questionResults.push({
      sectionResultId: sectionResult2.id,
      questionId: q.id,
      userAnswer: i === 3 ? 'C' : 'B', // 4번째 문제만 틀림
      isCorrect: i !== 3,
      pointsEarned: i !== 3 ? 1 : 0,
      pointsPossible: 1,
      timeSpent: 120,
      answeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + (section1Questions.length + i) * 120 * 1000),
    });
  }

  await prisma.questionResult.createMany({ data: questionResults });
  console.log('✅ Question Results created');

  // 14. User Exam Sessions 생성
  await prisma.userExamSession.create({
    data: {
      userId: testUser.id,
      examId: exam2.id,
      examResultId: examResult2.id,
      currentSectionId: section2_1.id,
      currentQuestionNumber: 3,
      answers: {
        [section2_1.id]: {
          q1: 'A',
          q2: 'B',
        },
      },
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 10 * 60 * 1000), // 10분 전
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 만료
    },
  });
  console.log('✅ User Exam Session created');

  // 15. Key Usage Logs 생성
  await prisma.keyUsageLog.createMany({
    data: [
      {
        licenseKeyId: licenseKey1.id,
        userId: testUser.id,
        examId: exam1.id,
        examResultId: examResult1.id,
        action: 'EXAM_START',
        status: 'success',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        licenseKeyId: licenseKey1.id,
        userId: testUser.id,
        examId: exam1.id,
        examResultId: examResult1.id,
        action: 'EXAM_SUBMIT',
        status: 'success',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        licenseKeyId: licenseKey2.id,
        userId: testUser.id,
        examId: exam2.id,
        examResultId: examResult2.id,
        action: 'EXAM_START',
        status: 'success',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    ],
  });
  console.log('✅ Key Usage Logs created');

  // 16. Audit Logs 생성
  await prisma.auditLog.createMany({
    data: [
      {
        userId: ADMIN_USER_ID,
        action: 'CREATE_EXAM',
        entityType: 'Exam',
        entityId: exam1.id,
        changes: { title: exam1.title, examType: exam1.examType },
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Panel',
      },
      {
        userId: ADMIN_USER_ID,
        action: 'CREATE_EXAM',
        entityType: 'Exam',
        entityId: exam2.id,
        changes: { title: exam2.title, examType: exam2.examType },
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Panel',
      },
      {
        userId: ADMIN_USER_ID,
        action: 'CREATE_LICENSE_KEY',
        entityType: 'LicenseKey',
        entityId: licenseKey1.id,
        changes: { keyType: licenseKey1.keyType, usageLimit: licenseKey1.usageLimit },
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Panel',
      },
      {
        userId: testUser.id,
        action: 'START_EXAM',
        entityType: 'ExamResult',
        entityId: examResult1.id,
        changes: { examId: examResult1.examId, status: examResult1.status },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ],
  });
  console.log('✅ Audit Logs created');

  console.log('\n✨ Sample data creation completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: 2 (1 admin, 1 test user)`);
  console.log(`   - Exams: 2`);
  console.log(`   - Sections: 5`);
  console.log(`   - Questions: 11`);
  console.log(`   - License Keys: 2`);
  console.log(`   - Word Books: 3`);
  console.log(`   - Exam Results: 2`);
  console.log(`   - Section Results: 2`);
  console.log(`   - Question Results: 11`);
  console.log(`   - User Exam Sessions: 1`);
  console.log(`   - Key Usage Logs: 3`);
  console.log(`   - Audit Logs: 4`);
  console.log(`   - Question Banks: 1\n`);
}

function generateLicenseKey(): string {
  return `KEY-${crypto.randomBytes(8).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

