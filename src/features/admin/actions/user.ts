'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Role, UserStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  status: UserStatus;
  canWrite: boolean;
  createdAt: Date;
  _count: { articles: number; readHistories: number };
};

export async function getAdminUsersAction(options: {
  search?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
} = {}) {
  await requireAdmin();

  const { search, role, status, page = 1, limit = 10 } = options;

  const where = {
    ...(role   && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name:  { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [users, total, adminCount, premiumCount, memberCount, activeCount, lockedCount] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, name: true, email: true, image: true,
        role: true, status: true, canWrite: true, createdAt: true,
        _count: { select: { articles: true, readHistories: true } },
      },
    }),
    db.user.count({ where }),
    db.user.count({ where: { ...where, role: Role.ADMIN   } }),
    db.user.count({ where: { ...where, role: Role.PREMIUM } }),
    db.user.count({ where: { ...where, role: Role.MEMBER  } }),
    db.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
    db.user.count({ where: { ...where, status: UserStatus.LOCKED } }),
  ]);

  return {
    users: users as AdminUser[],
    total,
    totalPages: Math.ceil(total / limit),
    page,
    counts: { all: total, Admin: adminCount, Premium: premiumCount, Member: memberCount, active: activeCount, locked: lockedCount },
  };
}

export async function updateUserRoleAction(id: string, role: Role) {
  await requireAdmin();
  await db.user.update({ where: { id }, data: { role } });
  revalidatePath('/admin/users');
}

export async function toggleUserStatusAction(id: string) {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id }, select: { status: true } });
  if (!user) throw new Error('User not found');
  const next = user.status === 'ACTIVE' ? UserStatus.LOCKED : UserStatus.ACTIVE;
  await db.user.update({ where: { id }, data: { status: next } });
  revalidatePath('/admin/users');
}

export async function toggleUserCanWriteAction(id: string) {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id }, select: { canWrite: true } });
  if (!user) throw new Error('User not found');
  await db.user.update({ where: { id }, data: { canWrite: !user.canWrite } });
  revalidatePath('/admin/users');
}
