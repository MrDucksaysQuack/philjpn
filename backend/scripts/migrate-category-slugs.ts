/**
 * 기존 카테고리 데이터에 slug 자동 생성 스크립트
 * 
 * 사용법:
 *   npx ts-node scripts/migrate-category-slugs.ts
 * 
 * 또는:
 *   npm run migrate:category-slugs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Slug 생성 (이름 기반)
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

/**
 * 고유한 Slug 생성 (중복 검사)
 */
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function main() {
  console.log('🚀 카테고리 slug 마이그레이션 시작...\n');

  try {
    // slug가 없는 모든 카테고리 조회
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { slug: { equals: null } as any },
          { slug: '' },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (categories.length === 0) {
      console.log('✅ 모든 카테고리에 slug가 이미 설정되어 있습니다.');
      return;
    }

    console.log(`📋 ${categories.length}개의 카테고리를 처리합니다.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      try {
        const slug = await generateUniqueSlug(category.name, category.id);
        
        await prisma.category.update({
          where: { id: category.id },
          data: { slug },
        });

        console.log(`✅ ${category.name} → ${slug}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${category.name} 처리 실패:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 마이그레이션 완료:`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

    // 최종 검증
    const remaining = await prisma.category.count({
      where: {
        OR: [
          { slug: { equals: null } as any },
          { slug: '' },
        ],
      },
    });

    if (remaining === 0) {
      console.log('\n🎉 모든 카테고리에 slug가 성공적으로 설정되었습니다!');
    } else {
      console.log(`\n⚠️  ${remaining}개의 카테고리에 여전히 slug가 없습니다.`);
    }
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  });

