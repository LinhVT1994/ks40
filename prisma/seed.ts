import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function seedTopics() {
  console.log('⏳ Seeding Topics...');
  const parentDefs = [
    { slug: 'cong-nghe-thong-tin', label: 'Công nghệ thông tin', emoji: '💻', color: '#3b82f6', order: 0 },
    { slug: 'xay-dung-bim', label: 'Xây dựng & BIM', emoji: '🏗️', color: '#f59e0b', order: 1 },
    { slug: 'y-te-duoc', label: 'Y tế & Dược', emoji: '⚕️', color: '#ef4444', order: 2 },
    { slug: 'tai-chinh-ngan-hang', label: 'Tài chính & Ngân hàng', emoji: '💰', color: '#10b981', order: 3 },
    { slug: 'giao-duc', label: 'Giáo dục', emoji: '🎓', color: '#8b5cf6', order: 4 },
    { slug: 'san-xuat-ky-thuat', label: 'Sản xuất & Kỹ thuật', emoji: '⚙️', color: '#64748b', order: 5 },
    { slug: 'marketing-truyen-thong', label: 'Marketing & Truyền thông', emoji: '📢', color: '#ec4899', order: 6 },
    { slug: 'phap-ly-luat', label: 'Pháp lý & Luật', emoji: '⚖️', color: '#1e3a8a', order: 7 },
    { slug: 'kinh-doanh-quan-tri', label: 'Kinh doanh & Quản trị', emoji: '💼', color: '#d97706', order: 8 },
    { slug: 'nghe-thuat-sang-tao', label: 'Nghệ thuật & Sáng tạo', emoji: '🎨', color: '#f43f5e', order: 9 },
    { slug: 'nong-nghiep-moi-truong', label: 'Nông nghiệp & Môi trường', emoji: '🌱', color: '#22c55e', order: 10 },
    { slug: 'du-lich-khach-san', label: 'Du lịch & Khách sạn', emoji: '🏖️', color: '#0ea5e9', order: 11 },
  ];

  const rawChildren = [
    "Công nghệ thông tin,Lập trình", "Công nghệ thông tin,Trí tuệ nhân tạo", "Công nghệ thông tin,Kiểm thử phần mềm", "Công nghệ thông tin,DevOps & Cloud", "Công nghệ thông tin,An ninh mạng", "Công nghệ thông tin,Khoa học dữ liệu", "Công nghệ thông tin,Thiết kế UI/UX", "Công nghệ thông tin,Quản trị hệ thống", "Công nghệ thông tin,Mạng máy tính", "Công nghệ thông tin,Blockchain",
    "Xây dựng & BIM,Kiến trúc", "Xây dựng & BIM,Kết cấu", "Xây dựng & BIM,BIM & CAD", "Xây dựng & BIM,MEP", "Xây dựng & BIM,Quản lý dự án", "Xây dựng & BIM,Địa kỹ thuật", "Xây dựng & BIM,Hạ tầng & giao thông", "Xây dựng & BIM,Vật liệu xây dựng", "Xây dựng & BIM,Thi công", "Xây dựng & BIM,Giám sát công trình",
    "Y tế & Dược,Bác sĩ lâm sàng", "Y tế & Dược,Dược học", "Y tế & Dược,Điều dưỡng", "Y tế & Dược,Y học cổ truyền", "Y tế & Dược,Kỹ thuật y tế", "Y tế & Dược,Dinh dưỡng", "Y tế & Dược,Phẫu thuật", "Y tế & Dược,Chẩn đoán hình ảnh", "Y tế & Dược,Sức khỏe tâm thần", "Y tế & Dược,Y tế cộng đồng",
    "Tài chính & Ngân hàng,Ngân hàng", "Tài chính & Ngân hàng,Chứng khoán", "Tài chính & Ngân hàng,Kế toán & Kiểm toán", "Tài chính & Ngân hàng,Bảo hiểm", "Tài chính & Ngân hàng,FinTech", "Tài chính & Ngân hàng,Quản lý rủi ro", "Tài chính & Ngân hàng,Đầu tư", "Tài chính & Ngân hàng,Phân tích tài chính", "Tài chính & Ngân hàng,Thuế", "Tài chính & Ngân hàng,Thanh toán số",
    "Giáo dục,Giảng dạy", "Giáo dục,Nghiên cứu khoa học", "Giáo dục,Quản lý giáo dục", "Giáo dục,EdTech", "Giáo dục,Tâm lý giáo dục", "Giáo dục,Giáo dục đặc biệt", "Giáo dục,Đào tạo nghề", "Giáo dục,Thiết kế chương trình", "Giáo dục,Đánh giá học tập", "Giáo dục,Giáo dục trực tuyến",
    "Sản xuất & Kỹ thuật,Cơ khí", "Sản xuất & Kỹ thuật,Điện & Điện tử", "Sản xuất & Kỹ thuật,Tự động hóa", "Sản xuất & Kỹ thuật,Kiểm soát chất lượng", "Sản xuất & Kỹ thuật,Kỹ thuật hóa học", "Sản xuất & Kỹ thuật,Năng lượng", "Sản xuất & Kỹ thuật,Robotics", "Sản xuất & Kỹ thuật,In 3D & Gia công", "Sản xuất & Kỹ thuật,Logistics", "Sản xuất & Kỹ thuật,An toàn lao động",
    "Marketing & Truyền thông,Digital Marketing", "Marketing & Truyền thông,PR & Quan hệ công chúng", "Marketing & Truyền thông,Content Creator", "Marketing & Truyền thông,Social Media", "Marketing & Truyền thông,SEO & SEM", "Marketing & Truyền thông,Quảng cáo", "Marketing & Truyền thông,Nghiên cứu thị trường", "Marketing & Truyền thông,Thương hiệu", "Marketing & Truyền thông,E-commerce", "Marketing & Truyền thông,Video & Podcast",
    "Pháp lý & Luật,Luật dân sự", "Pháp lý & Luật,Luật hình sự", "Pháp lý & Luật,Luật doanh nghiệp", "Pháp lý & Luật,Sở hữu trí tuệ", "Pháp lý & Luật,Luật lao động", "Pháp lý & Luật,Luật quốc tế", "Pháp lý & Luật,Hợp đồng", "Pháp lý & Luật,Tư vấn pháp lý", "Pháp lý & Luật,Luật bất động sản", "Pháp lý & Luật,Luật thuế",
    "Kinh doanh & Quản trị,Quản trị doanh nghiệp", "Kinh doanh & Quản trị,Khởi nghiệp", "Kinh doanh & Quản trị,Chiến lược kinh doanh", "Kinh doanh & Quản trị,Nguồn nhân lực", "Kinh doanh & Quản trị,Quản lý vận hành", "Kinh doanh & Quản trị,Chuỗi cung ứng", "Kinh doanh & Quản trị,Bán hàng", "Kinh doanh & Quản trị,Mua hàng & Đàm phán", "Kinh doanh & Quản trị,Quản lý sản phẩm", "Kinh doanh & Quản trị,Tư vấn doanh nghiệp",
    "Nghệ thuật & Sáng tạo,Thiết kế đồ họa", "Nghệ thuật & Sáng tạo,Nhiếp ảnh", "Nghệ thuật & Sáng tạo,Âm nhạc", "Nghệ thuật & Sáng tạo,Điện ảnh & Video", "Nghệ thuật & Sáng tạo,Kiến trúc nội thất", "Nghệ thuật & Sáng tạo,Thời trang", "Nghệ thuật & Sáng tạo,Hoạt hình", "Nghệ thuật & Sáng tạo,Game Design", "Nghệ thuật & Sáng tạo,Nghệ thuật số", "Nghệ thuật & Sáng tạo,Viết sáng tạo",
    "Nông nghiệp & Môi trường,Trồng trọt", "Nông nghiệp & Môi trường,Chăn nuôi", "Nông nghiệp & Môi trường,Thủy sản", "Nông nghiệp & Môi trường,Lâm nghiệp", "Nông nghiệp & Môi trường,Nông nghiệp công nghệ cao", "Nông nghiệp & Môi trường,Bảo vệ môi trường", "Nông nghiệp & Môi trường,Quản lý tài nguyên", "Nông nghiệp & Môi trường,Khí tượng học", "Nông nghiệp & Môi trường,Sinh thái", "Nông nghiệp & Môi trường,Năng lượng tái tạo",
    "Du lịch & Khách sạn,Hướng dẫn du lịch", "Du lịch & Khách sạn,Quản lý khách sạn", "Du lịch & Khách sạn,Ẩm thực & F&B", "Du lịch & Khách sạn,Lữ hành", "Du lịch & Khách sạn,Spa & Wellness", "Du lịch & Khách sạn,Tổ chức sự kiện", "Du lịch & Khách sạn,Quản lý resort", "Du lịch & Khách sạn,Du lịch bền vững", "Du lịch & Khách sạn,Marketing du lịch", "Du lịch & Khách sạn,Ngoại ngữ"
  ];

  const generateSlug = (text: string) => text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const topicMap: Record<string, string> = {};

  for (const t of parentDefs) {
    const topic = await db.topic.upsert({
      where:  { slug: t.slug },
      update: {},
      create: { slug: t.slug, label: t.label, emoji: t.emoji, color: t.color, order: t.order, enabled: true },
    });
    topicMap[t.label] = topic.id; // Map by label for easy parent lookup
    topicMap[t.slug] = topic.id;
  }

  let childOrder = 100;
  for (const item of rawChildren) {
    const [parentLabel, childLabel] = item.split(',');
    const parentDef = parentDefs.find(p => p.label === parentLabel);
    if (!parentDef) continue;

    const parentId = topicMap[parentDef.slug];
    const childSlugBase = generateSlug(childLabel);
    const slug = `${parentDef.slug}-${childSlugBase}`;
    
    const topic = await db.topic.upsert({
      where:  { slug },
      update: {},
      create: { slug, label: childLabel, color: parentDef.color, parentId, order: childOrder++, enabled: true },
    });
    topicMap[slug] = topic.id;
  }

  return { parentDefs, childDefs: rawChildren, topicMap };
}

async function seedOccupations() {
  console.log('⏳ Seeding Occupation Options...');
  const occupationOptions = [
    { value: 'engineer',  label: 'Kỹ thuật & IT',      emoji: '💻', description: 'Lập trình viên, Data AI, DevOps, Kỹ sư mạng...', order: 1, enabled: true },
    { value: 'creator',   label: 'Thiết kế & Sáng tạo', emoji: '🎨', description: 'UI/UX, Đồ hoạ, Sáng tạo nội dung, Media...', order: 2, enabled: true },
    { value: 'architect', label: 'Kiến trúc & Xây dựng',emoji: '🏗️', description: 'Kỹ sư công trình, Kiến trúc sư, Quản lý / BIM...', order: 3, enabled: true },
    { value: 'educator',  label: 'Giáo dục & Nghiên cứu',emoji: '🎓', description: 'Giảng viên, Nghiên cứu sinh, Người làm EdTech...', order: 4, enabled: true },
    { value: 'student',   label: 'Học sinh / Sinh viên', emoji: '📚', description: 'Đang đi học, trau dồi chuyên môn hoặc tìm hướng đi.', order: 5, enabled: true },
    { value: 'other',     label: 'Ngành nghề khác',      emoji: '✨', description: 'Tâm lý học, Năng suất và Phát triển bản thân.', order: 6, enabled: true },
  ];

  for (const opt of occupationOptions) {
    await db.occupationOption.upsert({
      where: { value: opt.value },
      update: opt,
      create: opt,
    });
  }
  return occupationOptions;
}

async function seedUsers(topicMap: Record<string, string>) {
  console.log('⏳ Seeding Users...');
  const adminPassword   = await bcrypt.hash('admin123456a@', 12);

  const admin = await db.user.upsert({
    where:  { email: 'admin@lenote.dev' },
    update: {},
    create: {
      email:    'admin@lenote.dev',
      name:     'Lenote Admin',
      password: adminPassword,
      role:     'ADMIN',
      status:   'ACTIVE',
      bio:      'Quản trị viên hệ thống Lenote.',
      image:    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const users: typeof admin[] = [admin];

  // Onboarding cho admin
  await db.userOnboarding.upsert({
    where:  { userId: admin.id },
    update: {},
    create: {
      userId:          admin.id,
      completedAt:     new Date(),
    },
  });

  return users;
}

async function seedTags() {
  console.log('⏳ Seeding Tags...');
  const tagNames = [
    // Công nghệ thông tin
    "Python", "JavaScript", "SQL", "Git", "REST API", "Linux", "Thuật toán & Cấu trúc dữ liệu",
    "Tư duy phản biện", "Làm việc nhóm", "Giải quyết vấn đề", "Học liên tục",
    "VS Code", "GitHub", "Docker", "AWS", "Jira", "Postman", "Figma",
    "AWS Certified Solutions Architect", "Google Cloud Professional", "CompTIA Security+", "CISSP", "Certified Scrum Master",
    "Generative AI", "Cloud Native", "Zero Trust Security", "Edge Computing",

    // Xây dựng & BIM
    "Đọc bản vẽ kỹ thuật", "Tính toán kết cấu", "Lập dự toán", "Quản lý tiến độ", "Thiết kế BIM", "Khảo sát địa hình",
    "Lãnh đạo công trường", "Giao tiếp kỹ thuật", "Quản lý rủi ro", "Đàm phán",
    "AutoCAD", "Revit", "Navisworks", "SketchUp", "Primavera P6", "MS Project", "Tekla Structures",
    "PMP", "LEED AP", "BIM Manager Certified", "Kỹ sư xây dựng (PE)",
    "BIM Level 3", "Digital Twin", "Green Building", "Prefabrication"
  ];

  const uniqueTags = [...new Set(tagNames.map(t => t.trim()))];
  const tags: Record<string, string> = {};

  for (const name of uniqueTags) {
    const slug = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
      
    const tag = await db.tag.upsert({
      where:  { slug },
      update: {},
      create: { name, slug },
    });
    tags[name] = tag.id;
  }
  
  return Object.values(tags);
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  const { parentDefs, childDefs, topicMap } = await seedTopics();
  const occupations = await seedOccupations();
  await seedUsers(topicMap);
  const tags = await seedTags();

  console.log('✅ Seed xong cho môi trường Gốc (Production Ready):');
  console.log('   Tài khoản:');
  console.log('     admin@lenote.dev    / admin123456a@   (ADMIN)');
  console.log(`   Đã khởi tạo Topic Tree: ${parentDefs.length} Parent, ${childDefs.length} Children`);
  console.log(`   Đã cài đặt ${occupations.length} Vai trò (Occupation).`);
  console.log(`   Đã lót sẵn ${tags.length} Tags SEO.`);
  console.log('   (Các dữ liệu rác về Bài viết, Bình luận, Tương tác đã được dọn sạch)');
}

main().finally(() => db.$disconnect());
