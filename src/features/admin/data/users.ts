export type UserRole = 'Admin' | 'Premium' | 'Member';
export type UserStatus = 'active' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  docsViewed: number;
  articlesWritten: number;
  lastActive: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  Admin: {
    label: 'Admin',
    className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  },
  Premium: {
    label: 'Premium',
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
  Member: {
    label: 'Member',
    className: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400',
  },
};

export const STATUS_CONFIG: Record<UserStatus, { label: string; className: string }> = {
  active: {
    label: 'Hoạt động',
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  locked: {
    label: 'Khoá',
    className: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400',
  },
};

export const USER_ROLES: UserRole[] = ['Admin', 'Premium', 'Member'];

export const mockUsers: User[] = [
  { id: '1',  name: 'Admin User',       email: 'admin@ks40.com',         role: 'Admin',   status: 'active', joinedAt: '2023-01-01', docsViewed: 248, articlesWritten: 52, lastActive: '2024-03-19' },
  { id: '2',  name: 'Linh VT',          email: 'linh.vt@email.com',      role: 'Premium', status: 'active', joinedAt: '2024-01-01', docsViewed: 134, articlesWritten: 14, lastActive: '2024-03-18' },
  { id: '3',  name: 'Trần Thị Bích',   email: 'bich.tt@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-01-10', docsViewed: 45,  articlesWritten: 0,  lastActive: '2024-03-17' },
  { id: '4',  name: 'Lê Văn Cường',    email: 'cuong.lv@email.com',     role: 'Member',  status: 'active', joinedAt: '2024-01-15', docsViewed: 78,  articlesWritten: 0,  lastActive: '2024-03-15' },
  { id: '5',  name: 'Phạm Minh Đức',   email: 'm.pham@email.com',       role: 'Premium', status: 'active', joinedAt: '2024-01-20', docsViewed: 212, articlesWritten: 22, lastActive: '2024-03-19' },
  { id: '6',  name: 'Nguyễn Hoàng Em', email: 'e.ng@email.com',         role: 'Member',  status: 'locked', joinedAt: '2024-01-25', docsViewed: 12,  articlesWritten: 0,  lastActive: '2024-02-10' },
  { id: '7',  name: 'Hoàng Thị Lan',   email: 'lan.ht@email.com',       role: 'Premium', status: 'active', joinedAt: '2024-02-01', docsViewed: 98,  articlesWritten: 7,  lastActive: '2024-03-18' },
  { id: '8',  name: 'Vũ Đình Minh',    email: 'minh.vd@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-02-05', docsViewed: 33,  articlesWritten: 0,  lastActive: '2024-03-12' },
  { id: '9',  name: 'Đặng Thị Nga',    email: 'nga.dt@email.com',       role: 'Member',  status: 'active', joinedAt: '2024-02-08', docsViewed: 55,  articlesWritten: 0,  lastActive: '2024-03-14' },
  { id: '10', name: 'Bùi Văn Oanh',    email: 'oanh.bv@email.com',      role: 'Member',  status: 'locked', joinedAt: '2024-02-10', docsViewed: 8,   articlesWritten: 0,  lastActive: '2024-02-15' },
  { id: '11', name: 'Trịnh Quốc Phát', email: 'phat.tq@email.com',      role: 'Premium', status: 'active', joinedAt: '2024-02-12', docsViewed: 167, articlesWritten: 18, lastActive: '2024-03-19' },
  { id: '12', name: 'Lý Thị Quỳnh',    email: 'quynh.lt@email.com',     role: 'Member',  status: 'active', joinedAt: '2024-02-14', docsViewed: 41,  articlesWritten: 0,  lastActive: '2024-03-10' },
  { id: '13', name: 'Dương Minh Sơn',  email: 'son.dm@email.com',       role: 'Premium', status: 'active', joinedAt: '2024-02-16', docsViewed: 203, articlesWritten: 31, lastActive: '2024-03-17' },
  { id: '14', name: 'Vương Thị Tâm',   email: 'tam.vt@email.com',       role: 'Member',  status: 'active', joinedAt: '2024-02-18', docsViewed: 19,  articlesWritten: 0,  lastActive: '2024-03-08' },
  { id: '15', name: 'Hồ Văn Uy',       email: 'uy.hv@email.com',        role: 'Member',  status: 'locked', joinedAt: '2024-02-20', docsViewed: 3,   articlesWritten: 0,  lastActive: '2024-02-22' },
  { id: '16', name: 'Phan Thị Vân',    email: 'van.pt@email.com',       role: 'Member',  status: 'active', joinedAt: '2024-02-22', docsViewed: 62,  articlesWritten: 0,  lastActive: '2024-03-16' },
  { id: '17', name: 'Ông Xuân Việt',   email: 'viet.ox@email.com',      role: 'Premium', status: 'active', joinedAt: '2024-02-25', docsViewed: 144, articlesWritten: 11, lastActive: '2024-03-18' },
  { id: '18', name: 'Quách Thị Xuân',  email: 'xuan.qt@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-02-27', docsViewed: 27,  articlesWritten: 0,  lastActive: '2024-03-13' },
  { id: '19', name: 'Lương Văn Yên',   email: 'yen.lv@email.com',       role: 'Member',  status: 'active', joinedAt: '2024-03-01', docsViewed: 14,  articlesWritten: 0,  lastActive: '2024-03-11' },
  { id: '20', name: 'Đỗ Thị Ánh',      email: 'anh.dt@email.com',       role: 'Member',  status: 'active', joinedAt: '2024-03-03', docsViewed: 9,   articlesWritten: 0,  lastActive: '2024-03-09' },
  { id: '21', name: 'Tô Minh Bảo',     email: 'bao.tm@email.com',       role: 'Premium', status: 'active', joinedAt: '2024-03-05', docsViewed: 88,  articlesWritten: 6,  lastActive: '2024-03-19' },
  { id: '22', name: 'Ứng Thị Cẩm',     email: 'cam.ut@email.com',       role: 'Member',  status: 'locked', joinedAt: '2024-03-06', docsViewed: 2,   articlesWritten: 0,  lastActive: '2024-03-07' },
  { id: '23', name: 'Viên Quốc Dũng',  email: 'dung.vq@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-03-08', docsViewed: 21,  articlesWritten: 0,  lastActive: '2024-03-15' },
  { id: '24', name: 'Xa Thị Giang',    email: 'giang.xt@email.com',     role: 'Member',  status: 'active', joinedAt: '2024-03-10', docsViewed: 7,   articlesWritten: 0,  lastActive: '2024-03-14' },
  { id: '25', name: 'Yên Văn Hải',     email: 'hai.yv@email.com',       role: 'Premium', status: 'active', joinedAt: '2024-03-12', docsViewed: 56,  articlesWritten: 4,  lastActive: '2024-03-18' },
  { id: '26', name: 'Ân Thị Iris',     email: 'iris.at@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-03-14', docsViewed: 4,   articlesWritten: 0,  lastActive: '2024-03-16' },
  { id: '27', name: 'Bảo Văn Khoa',    email: 'khoa.bv@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-03-15', docsViewed: 11,  articlesWritten: 0,  lastActive: '2024-03-17' },
  { id: '28', name: 'Châu Thị Liên',   email: 'lien.ct@email.com',      role: 'Member',  status: 'active', joinedAt: '2024-03-16', docsViewed: 6,   articlesWritten: 0,  lastActive: '2024-03-18' },
  { id: '29', name: 'Đinh Văn Mạnh',   email: 'manh.dv@email.com',      role: 'Member',  status: 'locked', joinedAt: '2024-03-17', docsViewed: 1,   articlesWritten: 0,  lastActive: '2024-03-17' },
  { id: '30', name: 'Emery Thị Nhi',   email: 'nhi.et@email.com',       role: 'Member',  status: 'active', joinedAt: '2024-03-18', docsViewed: 3,   articlesWritten: 0,  lastActive: '2024-03-19' },
];
