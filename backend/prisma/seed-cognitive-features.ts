/**
 * 인지 학습 기능 샘플 데이터 시드 스크립트
 * 
 * 이 스크립트는 다음 기능을 위한 샘플 데이터를 생성합니다:
 * - ExamTemplate: 시험 템플릿
 * - QuestionPool: 문제 풀
 * - UserGoal: 사용자 목표
 * - LearningPattern: 학습 패턴
 * - LearningCycle: 학습 사이클
 * 
 * 실행 방법:
 * npm run seed:cognitive
 * 또는
 * npx ts-node prisma/seed-cognitive-features.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 인지 학습 기능 샘플 데이터 생성 시작...\n');

  // 1. Admin 사용자 찾기 또는 생성
  let adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!adminUser) {
    console.log('📝 Admin 사용자 생성 중...');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        name: '관리자',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log(`✅ Admin 사용자 생성 완료: ${adminUser.email}\n`);
  }

  // 2. 일반 사용자 찾기 또는 생성 (목표 및 학습 패턴용)
  let testUser = await prisma.user.findFirst({
    where: { role: 'user', email: { not: 'admin@example.com' } },
  });

  if (!testUser) {
    console.log('📝 테스트 사용자 생성 중...');
    testUser = await prisma.user.create({
      data: {
        email: 'student@example.com',
        password: await bcrypt.hash('student123', 10),
        name: '학생 사용자',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log(`✅ 테스트 사용자 생성 완료: ${testUser.email}\n`);
  }

  // 3. 기존 시험 찾기 (템플릿 및 사이클용)
  const existingExams = await prisma.exam.findMany({
    take: 3,
    where: { isActive: true },
  });

  // 4. 기존 문제 찾기 (문제 풀용)
  const existingQuestions = await prisma.question.findMany({
    take: 20,
    where: {
      difficulty: { not: null },
    },
    select: {
      id: true,
      tags: true,
      difficulty: true,
    },
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 1. 문제 풀 (QuestionPool) 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 문제 풀 1: 문법 기초 문제 풀
  const grammarPoolIds = existingQuestions
    .filter((q) => q.tags?.some((tag) => tag.includes('문법')))
    .slice(0, 10)
    .map((q) => q.id);

  const grammarPool = await prisma.questionPool.upsert({
    where: {
      id: 'sample-pool-grammar-basic',
    },
    update: {},
    create: {
      id: 'sample-pool-grammar-basic',
      name: '문법 기초 문제 풀',
      description: '영어 문법 기초 개념을 다루는 문제 모음집',
      tags: ['문법', '기초', '시제', '조동사'],
      difficulty: 'easy',
      questionIds: grammarPoolIds,
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ 생성: ${grammarPool.name} (${grammarPool.questionIds.length}개 문제)`);

  // 문제 풀 2: 어휘 중급 문제 풀
  const vocabularyPoolIds = existingQuestions
    .filter((q) => q.tags?.some((tag) => tag.includes('어휘')) || q.difficulty === 'medium')
    .slice(0, 15)
    .map((q) => q.id);

  const vocabularyPool = await prisma.questionPool.upsert({
    where: {
      id: 'sample-pool-vocabulary-intermediate',
    },
    update: {},
    create: {
      id: 'sample-pool-vocabulary-intermediate',
      name: '어휘 중급 문제 풀',
      description: '중급 수준의 어휘 문제 모음집',
      tags: ['어휘', '중급', '단어'],
      difficulty: 'medium',
      questionIds: vocabularyPoolIds,
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ 생성: ${vocabularyPool.name} (${vocabularyPool.questionIds.length}개 문제)`);

  // 문제 풀 3: 독해 고급 문제 풀
  const readingPoolIds = existingQuestions
    .filter((q) => q.tags?.some((tag) => tag.includes('독해')) || q.difficulty === 'hard')
    .slice(0, 12)
    .map((q) => q.id);

  const readingPool = await prisma.questionPool.upsert({
    where: {
      id: 'sample-pool-reading-advanced',
    },
    update: {},
    create: {
      id: 'sample-pool-reading-advanced',
      name: '독해 고급 문제 풀',
      description: '고급 수준의 독해 문제 모음집',
      tags: ['독해', '고급', '이해'],
      difficulty: 'hard',
      questionIds: readingPoolIds,
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ 생성: ${readingPool.name} (${readingPool.questionIds.length}개 문제)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 2. 시험 템플릿 (ExamTemplate) 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 템플릿 1: 토익 모의고사 템플릿
  const toeflTemplate = await prisma.examTemplate.upsert({
    where: {
      id: 'sample-template-toefl-mock',
    },
    update: {},
    create: {
      id: 'sample-template-toefl-mock',
      name: '토익 모의고사 템플릿',
      description: '표준 토익 시험 형식의 템플릿. 리스닝 + 리딩 섹션 구성',
      structure: {
        sections: [
          {
            type: '리스닝',
            questionCount: 100,
            tags: ['리스닝', '문법', '어휘'],
            difficulty: 'medium',
            description: '리스닝 섹션 (파트 1-4)',
          },
          {
            type: '리딩',
            questionCount: 100,
            tags: ['리딩', '문법', '독해'],
            difficulty: 'medium',
            description: '리딩 섹션 (파트 5-7)',
          },
        ],
        totalQuestions: 200,
        estimatedTime: 120, // 분
      },
      questionPoolIds: [grammarPool.id, vocabularyPool.id, readingPool.id],
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ 생성: ${toeflTemplate.name}`);

  // 템플릿 2: 문법 집중 연습 템플릿
  const grammarFocusTemplate = await prisma.examTemplate.upsert({
    where: {
      id: 'sample-template-grammar-focus',
    },
    update: {},
    create: {
      id: 'sample-template-grammar-focus',
      name: '문법 집중 연습 템플릿',
      description: '문법 약점 개선을 위한 집중 연습용 템플릿',
      structure: {
        sections: [
          {
            type: '문법 기초',
            questionCount: 30,
            tags: ['문법', '기초'],
            difficulty: 'easy',
            description: '기초 문법 문제',
          },
          {
            type: '문법 중급',
            questionCount: 30,
            tags: ['문법', '중급'],
            difficulty: 'medium',
            description: '중급 문법 문제',
          },
          {
            type: '문법 응용',
            questionCount: 20,
            tags: ['문법', '응용'],
            difficulty: 'hard',
            description: '응용 문법 문제',
          },
        ],
        totalQuestions: 80,
        estimatedTime: 60,
      },
      questionPoolIds: [grammarPool.id],
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ 생성: ${grammarFocusTemplate.name}`);

  // 템플릿 3: 어휘 마스터 템플릿
  const vocabularyMasterTemplate = await prisma.examTemplate.upsert({
    where: {
      id: 'sample-template-vocabulary-master',
    },
    update: {},
    create: {
      id: 'sample-template-vocabulary-master',
      name: '어휘 마스터 템플릿',
      description: '어휘력 향상을 위한 종합 연습 템플릿',
      structure: {
        sections: [
          {
            type: '어휘 기초',
            questionCount: 25,
            tags: ['어휘', '기초'],
            difficulty: 'easy',
          },
          {
            type: '어휘 중급',
            questionCount: 25,
            tags: ['어휘', '중급'],
            difficulty: 'medium',
          },
          {
            type: '어휘 고급',
            questionCount: 20,
            tags: ['어휘', '고급'],
            difficulty: 'hard',
          },
        ],
        totalQuestions: 70,
        estimatedTime: 50,
      },
      questionPoolIds: [vocabularyPool.id],
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ 생성: ${vocabularyMasterTemplate.name}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 3. 사용자 목표 (UserGoal) 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 목표 1: 점수 목표 (진행 중)
  const scoreGoal = await prisma.userGoal.upsert({
    where: {
      id: 'sample-goal-score-900',
    },
    update: {},
    create: {
      id: 'sample-goal-score-900',
      userId: testUser.id,
      goalType: 'score_target',
      targetValue: 900,
      currentValue: 850,
      deadline: new Date('2024-12-31'),
      status: 'active',
      milestones: [
        { date: '2024-11-15', target: 850 },
        { date: '2024-11-30', target: 875 },
        { date: '2024-12-15', target: 890 },
      ],
    },
  });
  console.log(`✅ 생성: 점수 목표 - ${scoreGoal.targetValue}점 (현재: ${scoreGoal.currentValue}점)`);

  // 목표 2: 약점 회복 목표
  const weaknessGoal = await prisma.userGoal.upsert({
    where: {
      id: 'sample-goal-weakness-grammar',
    },
    update: {},
    create: {
      id: 'sample-goal-weakness-grammar',
      userId: testUser.id,
      goalType: 'weakness_recovery',
      targetValue: 80, // 목표 정답률 80%
      currentValue: 65,
      deadline: new Date('2024-12-15'),
      status: 'active',
      milestones: [
        { date: '2024-11-15', target: 70 },
        { date: '2024-11-30', target: 75 },
      ],
    },
  });
  console.log(`✅ 생성: 약점 회복 목표 - 문법 (목표: ${weaknessGoal.targetValue}%, 현재: ${weaknessGoal.currentValue}%)`);

  // 목표 3: 시험 횟수 목표
  const examCountGoal = await prisma.userGoal.upsert({
    where: {
      id: 'sample-goal-exam-count',
    },
    update: {},
    create: {
      id: 'sample-goal-exam-count',
      userId: testUser.id,
      goalType: 'exam_count',
      targetValue: 20,
      currentValue: 12,
      deadline: new Date('2024-12-31'),
      status: 'active',
    },
  });
  console.log(`✅ 생성: 시험 횟수 목표 - ${examCountGoal.targetValue}회 (현재: ${examCountGoal.currentValue}회)`);

  // 목표 4: 단어 학습 목표 (달성됨)
  const wordGoal = await prisma.userGoal.upsert({
    where: {
      id: 'sample-goal-word-achieved',
    },
    update: {},
    create: {
      id: 'sample-goal-word-achieved',
      userId: testUser.id,
      goalType: 'word_count',
      targetValue: 100,
      currentValue: 100,
      deadline: new Date('2024-11-30'),
      status: 'achieved',
    },
  });
  console.log(`✅ 생성: 단어 학습 목표 - ${wordGoal.targetValue}개 (달성 완료!)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 4. 학습 패턴 (LearningPattern) 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 최근 30일간의 학습 패턴 데이터 생성
  const now = new Date();
  const learningPatterns: any[] = [];

  // 다양한 시간대와 요일의 학습 패턴 시뮬레이션
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay(); // 0(일) ~ 6(토)

    // 월~금: 주로 오전/오후 학습, 주말: 낮 학습
    const hours = dayOfWeek >= 1 && dayOfWeek <= 5
      ? [9, 10, 14, 15, 16, 20, 21] // 평일
      : [10, 11, 14, 15]; // 주말

    // 하루에 1-3회 학습 세션
    const sessionCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < sessionCount; j++) {
      const hour = hours[Math.floor(Math.random() * hours.length)];
      const sessionLength = Math.floor(Math.random() * 60) + 30; // 30-90분
      const score = Math.random() * 30 + 70; // 70-100점
      const focusLevel = Math.random() * 0.3 + 0.7; // 0.7-1.0
      const efficiency = Math.random() * 0.2 + 0.75; // 0.75-0.95

      learningPatterns.push({
        userId: testUser.id,
        date: date,
        hour: hour,
        dayOfWeek: dayOfWeek,
        sessionLength: sessionLength,
        score: Math.round(score * 10) / 10,
        focusLevel: Math.round(focusLevel * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
      });
    }
  }

  // 기존 데이터 삭제 후 새로 생성
  await prisma.learningPattern.deleteMany({
    where: { userId: testUser.id },
  });

  await prisma.learningPattern.createMany({
    data: learningPatterns,
  });

  console.log(`✅ 생성: 학습 패턴 ${learningPatterns.length}개 레코드 (최근 30일)`);
  console.log(`   - 평균 세션 길이: ${Math.round(learningPatterns.reduce((sum, p) => sum + p.sessionLength, 0) / learningPatterns.length)}분`);
  console.log(`   - 가장 활발한 시간대: ${Array.from(new Set(learningPatterns.map(p => p.hour))).slice(0, 3).join('시, ')}시\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 5. 학습 사이클 (LearningCycle) 생성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 사이클 1: 약점 집중 학습 사이클 (진행 중)
  const weaknessCycle = await prisma.learningCycle.upsert({
    where: {
      id: 'sample-cycle-weakness-active',
    },
    update: {},
    create: {
      id: 'sample-cycle-weakness-active',
      userId: testUser.id,
      cycleType: 'weakness_focused',
      stage: 'practice', // identify → practice → review → test
      startDate: new Date('2024-11-01'),
      endDate: null, // 진행 중
      targetWords: [], // 단어 ID 목록 (실제 단어 ID로 교체 가능)
      targetExams: existingExams.slice(0, 2).map((e) => e.id),
      improvement: null,
      wordsLearned: 0,
    },
  });
  console.log(`✅ 생성: 약점 집중 학습 사이클 (${weaknessCycle.stage} 단계)`);

  // 사이클 2: 어휘 학습 사이클 (완료됨)
  const vocabularyCycle = await prisma.learningCycle.upsert({
    where: {
      id: 'sample-cycle-vocabulary-completed',
    },
    update: {},
    create: {
      id: 'sample-cycle-vocabulary-completed',
      userId: testUser.id,
      cycleType: 'vocabulary',
      stage: 'test',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-10-15'),
      targetWords: [],
      targetExams: existingExams.slice(0, 1).map((e) => e.id),
      improvement: 12.5, // +12.5점 향상
      wordsLearned: 35,
    },
  });
  console.log(`✅ 생성: 어휘 학습 사이클 (완료, ${vocabularyCycle.improvement}점 향상, ${vocabularyCycle.wordsLearned}개 단어 학습)`);

  // 사이클 3: 종합 학습 사이클
  const comprehensiveCycle = await prisma.learningCycle.upsert({
    where: {
      id: 'sample-cycle-comprehensive',
    },
    update: {},
    create: {
      id: 'sample-cycle-comprehensive',
      userId: testUser.id,
      cycleType: 'comprehensive',
      stage: 'review',
      startDate: new Date('2024-11-05'),
      endDate: null,
      targetWords: [],
      targetExams: existingExams.map((e) => e.id),
      improvement: null,
      wordsLearned: 0,
    },
  });
  console.log(`✅ 생성: 종합 학습 사이클 (${comprehensiveCycle.stage} 단계)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 생성된 샘플 데이터 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const summary = {
    questionPools: await prisma.questionPool.count(),
    examTemplates: await prisma.examTemplate.count(),
    userGoals: await prisma.userGoal.count(),
    learningPatterns: await prisma.learningPattern.count(),
    learningCycles: await prisma.learningCycle.count(),
  };

  console.log(`📦 문제 풀: ${summary.questionPools}개`);
  console.log(`📋 시험 템플릿: ${summary.examTemplates}개`);
  console.log(`🎯 사용자 목표: ${summary.userGoals}개`);
  console.log(`📊 학습 패턴: ${summary.learningPatterns}개 레코드`);
  console.log(`🔄 학습 사이클: ${summary.learningCycles}개\n`);

  console.log('✨ 샘플 데이터 생성 완료!\n');
  console.log('💡 다음 명령어로 데이터를 확인할 수 있습니다:');
  console.log('   npm run prisma:studio\n');
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

