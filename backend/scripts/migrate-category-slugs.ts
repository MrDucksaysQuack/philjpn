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
    // slug는 @unique이므로 findUnique에서 사용 가능하지만, 타입 정의 문제로 인해 타입 단언 사용
    const existing = await prisma.category.findUnique({
      where: { slug } as any,
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
    // slug가 없는 모든 카테고리 조회 (빈 문자열만 체크, slug는 null이 될 수 없음)
    // 타입 정의 문제로 인해 타입 단언 사용
    const categories = await prisma.category.findMany({
      where: {
        slug: '',
      } as any,
      select: {
        id: true,
        name: true,
        slug: true,
      } as any,
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
        // category 타입이 배열로 추론되는 문제를 해결하기 위해 타입 단언 사용
        const categoryData = category as unknown as { id: string; name: string; slug: string | null };
        const slug = await generateUniqueSlug(categoryData.name, categoryData.id);
        
        await prisma.category.update({
          where: { id: categoryData.id },
          data: { slug } as any,
        });

        console.log(`✅ ${categoryData.name} → ${slug}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${category.name} 처리 실패:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 마이그레이션 완료:`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

    // 최종 검증 (빈 문자열만 체크)
    const remaining = await prisma.category.count({
      where: {
        slug: '',
      } as any,
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

