import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('admin123', 12);
  const user = await db.user.upsert({
    where:  { email: 'admin@ks40.com' },
    update: {},
    create: {
      email:    'admin@ks40.com',
      name:     'Admin KS40',
      password,
      role:     'ADMIN',
      status:   'ACTIVE',
    },
  });
  console.log('✅ Tạo xong:', user.email, '/ admin123');
}

main().finally(() => db.$disconnect());
