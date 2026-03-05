import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { config } from 'dotenv';
config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// Simple password hashing for seed data (NOT for production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.courseEdition.deleteMany();
  await prisma.course.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.guideAccess.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.session1on1.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.caseStudy.deleteMany();

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@perspectivaevei.com',
      name: 'Admin User',
      hashedPassword: hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      hashedPassword: hashPassword('test123'),
      role: 'USER',
    },
  });

  console.log('✅ Users created');

  // Create course
  const course = await prisma.course.create({
    data: {
      title: 'Cursul A.D.O.',
      slug: 'cursul-ado',
      description: 'Manifestation and consciousness coaching course',
      price: 1188,
      installmentPrice: 644,
      maxParticipants: 15,
      accessDurationDays: 30,
    },
  });

  console.log('✅ Course created');

  // Create course edition
  const now = new Date();
  const courseEdition = await prisma.courseEdition.create({
    data: {
      courseId: course.id,
      editionNumber: 10,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
      enrollmentOpen: true,
      maxParticipants: 15,
    },
  });

  console.log('✅ Course edition created');

  // Create lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      editionId: courseEdition.id,
      title: 'Introduction to Manifestation',
      order: 1,
      videoKey: 'lesson-1-intro',
      duration: 45,
      availableFrom: new Date(),
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      editionId: courseEdition.id,
      title: 'Core Principles',
      order: 2,
      videoKey: 'lesson-2-principles',
      duration: 60,
      availableFrom: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      editionId: courseEdition.id,
      title: 'Advanced Techniques',
      order: 3,
      videoKey: 'lesson-3-advanced',
      duration: 75,
      availableFrom: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Lessons created');

  // Create guides
  const guide1 = await prisma.guide.create({
    data: {
      title: 'Cine Manifestă?!',
      slug: 'cine-manifesta',
      description: 'Understanding the manifestor within',
      price: 99,
      coverImage: 'guide-1-cover.jpg',
      contentJson: { chapters: ['Chapter 1', 'Chapter 2'] },
      audioKey: 'guide-1-audio',
      audioDuration: 180,
    },
  });

  const guide2 = await prisma.guide.create({
    data: {
      title: 'Este despre mine!',
      slug: 'este-despre-mine',
      description: 'Personal transformation guide',
      price: 40,
      coverImage: 'guide-2-cover.jpg',
      contentJson: { chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3'] },
      audioKey: 'guide-2-audio',
      audioDuration: 240,
    },
  });

  const guide3 = await prisma.guide.create({
    data: {
      title: 'Este (tot) despre mine!',
      slug: 'este-tot-despre-mine',
      description: 'Advanced personal transformation',
      price: 70,
      coverImage: 'guide-3-cover.jpg',
      contentJson: { chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4'] },
      audioKey: 'guide-3-audio',
      audioDuration: 300,
    },
  });

  console.log('✅ Guides created');

  // Create bundle
  const bundle = await prisma.bundle.create({
    data: {
      title: 'Este despre mine! Bundle',
      slug: 'este-despre-mine-bundle',
      price: 82.5,
      originalPrice: 110,
      active: true,
    },
  });

  // Add guides to bundle
  await prisma.bundleItem.create({
    data: {
      bundleId: bundle.id,
      guideId: guide2.id,
    },
  });

  await prisma.bundleItem.create({
    data: {
      bundleId: bundle.id,
      guideId: guide3.id,
    },
  });

  console.log('✅ Bundle created with items');

  // Create product
  const product = await prisma.product.create({
    data: {
      title: 'Sacoșă din iută',
      slug: 'sacosa-din-iuta',
      description: 'Eco-friendly jute bag',
      price: 25,
      type: 'PHYSICAL',
      stock: 100,
      images: ['jute-bag-1.jpg', 'jute-bag-2.jpg'],
      active: true,
    },
  });

  console.log('✅ Product created');

  // Create blog post
  const blogPost = await prisma.blogPost.create({
    data: {
      title: 'Welcome to Perspectiva Evei',
      slug: 'welcome-to-perspectiva-evei',
      content: 'This is the first blog post about consciousness and manifestation.',
      coverImage: 'blog-cover-1.jpg',
      published: true,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Blog post created');

  // Create case study
  const caseStudy = await prisma.caseStudy.create({
    data: {
      title: 'Success Story: From Doubt to Manifestation',
      slug: 'success-story-doubt-to-manifestation',
      content: 'A detailed case study of a client journey...',
      coverImage: 'case-study-1.jpg',
      testimonialQuote: 'This course changed my life completely!',
      clientName: 'Maria S.',
      published: true,
    },
  });

  console.log('✅ Case study created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
