import { db } from '@/lib/db';
import { ArticleStatus, ArticleAudience } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Get a user (LinhVT1994 or first user)
    const user = await db.user.findFirst({
      where: { canWrite: true },
    }) || await db.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: 'No user found in DB' }, { status: 404 });
    }

    // 2. Get a topic
    const topic = await db.topic.findFirst({
      where: { enabled: true },
    }) || await db.topic.findFirst();

    if (!topic) {
      return NextResponse.json({ error: 'No topic found in DB' }, { status: 404 });
    }

    // 3. Cleanup previous dummy data if any
    await db.article.deleteMany({
      where: {
        summary: { contains: "Một nội dung được tạo ra tự động" },
        authorId: user.id
      }
    });

    // 4. Create 30 articles
    const titles = [
      "Nghệ thuật Sống Tối Giản", "Sức mạnh của Sự Tĩnh Lặng", "Hành trình Tìm lại Bản thân",
      "Viết lách và Sự Chữa lành", "Thiền định trong Thế giới Số", "Khám phá Trí tuệ Phương Đông",
      "Tư duy Thiết kế Zen", "Cảm hứng Từ Thiên nhiên", "Tối ưu hóa Hiệu suất Làm việc",
      "Nghệ thuật Thưởng Thức Trà", "Sống Trọn vẹn Từng Khoảnh khắc", "Bí mật của Sự Hạnh phúc",
      "Xây dựng Thói quen Tốt", "Kỹ năng Lắng nghe Bản thân", "Triết lý về Thời gian",
      "Không gian Sống và Tâm hồn", "Sức mạnh của Lòng Biết ơn", "Cân bằng Công việc và Cuộc sống",
      "Khởi đầu Ngày mới Tỉnh thức", "Nghệ thuật Buông bỏ", "Sáng tạo trong Bình yên",
      "Kết nối với Cộng đồng", "Học cách Nói Không", "Giá trị của Sự Đơn giản",
      "Vẻ đẹp của Sự Không Hoàn hảo", "Tìm kiếm Ý nghĩa Cuộc sống", "Sống đời Tự do",
      "Tâm trí và Cơ thể", "Năng lượng Tích cực", "Kết thúc để Khởi đầu"
    ];

    const dummyArticles = titles.map((title, i) => {
      const slug = `dummy-${title.toLowerCase().replace(/ /g, '-')}-${i}`;
      return {
        title,
        slug,
        summary: `Đây là bản tóm tắt cho bài viết "${title}". Một nội dung được tạo ra tự động để phục vụ cho mục đích kiểm tra giao diện phân trang và bố cục Smart Grid trên trang hồ sơ cá nhân.`,
        content: `<p>Nội dung chi tiết của bài viết "${title}" sẽ cung cấp cho bạn những góc nhìn sâu sắc về chủ đề này.</p>`,
        thumbnail: `https://picsum.photos/seed/${slug}/800/450`,
        topicId: topic.id,
        authorId: user.id,
        status: ArticleStatus.PUBLISHED,
        audience: ArticleAudience.PUBLIC,
        viewCount: Math.floor(Math.random() * 1000),
        publishedAt: new Date(Date.now() - i * 86400000),
        readTime: Math.floor(Math.random() * 10) + 1,
      };
    });

    // Use createMany to insert all
    await db.article.createMany({
      data: dummyArticles,
      skipDuplicates: true,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded 30 articles for user: ${user.name}`,
      userId: user.id,
      username: user.username
    });

  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
