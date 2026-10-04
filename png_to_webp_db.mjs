/**
 * Upload URL'lerini DB'de .png → .webp günceller
 * Çalıştır: node png_to_webp_db.mjs
 */
import { PrismaClient } from './packages/database/generated/client/index.js';

const prisma = new PrismaClient();

// /uploads/ içindeki .png yolunu .webp yap
const toWebp = (url) => url?.endsWith('.png') && url.includes('/uploads/') ? url.replace(/\.png$/, '.webp') : url;

async function main() {
  let total = 0;

  // User: avatarUrl
  const users = await prisma.user.findMany({ where: { avatarUrl: { endsWith: '.png', contains: '/uploads/' } } });
  for (const u of users) {
    await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: toWebp(u.avatarUrl) } });
    console.log(`user avatarUrl: ${u.avatarUrl} → ${toWebp(u.avatarUrl)}`);
    total++;
  }

  // Creator: avatarUrl, coverUrl
  const creators = await prisma.creator.findMany({
    where: { OR: [{ avatarUrl: { endsWith: '.png', contains: '/uploads/' } }, { coverUrl: { endsWith: '.png', contains: '/uploads/' } }] }
  });
  for (const c of creators) {
    await prisma.creator.update({
      where: { id: c.id },
      data: { avatarUrl: toWebp(c.avatarUrl), coverUrl: toWebp(c.coverUrl) }
    });
    console.log(`creator ${c.id}: avatarUrl/coverUrl güncellendi`);
    total++;
  }

  // Program: imageUrl, coverUrl
  const programs = await prisma.program.findMany({ where: { imageUrl: { endsWith: '.png', contains: '/uploads/' } } }).catch(() => []);
  for (const p of programs) {
    await prisma.program.update({ where: { id: p.id }, data: { imageUrl: toWebp(p.imageUrl) } });
    total++;
  }

  // Course: imageUrl
  const courses = await prisma.course.findMany({ where: { imageUrl: { endsWith: '.png', contains: '/uploads/' } } }).catch(() => []);
  for (const c of courses) {
    await prisma.course.update({ where: { id: c.id }, data: { imageUrl: toWebp(c.imageUrl) } });
    total++;
  }

  console.log(`\n✅ Toplam güncellenen: ${total} kayıt`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
