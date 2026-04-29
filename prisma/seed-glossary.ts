import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const generateSlug = (text: string) => text.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

async function main() {
  console.log('🌱 Seeding 100 Glossary Terms...');

  const topics = await db.topic.findMany({ select: { id: true, slug: true } });
  const itTopic = topics.find(t => t.slug === 'cong-nghe-thong-tin')?.id;
  const bimTopic = topics.find(t => t.slug === 'xay-dung-bim')?.id;
  const healthTopic = topics.find(t => t.slug === 'y-te-duoc')?.id;
  const financeTopic = topics.find(t => t.slug === 'tai-chinh-ngan-hang')?.id;

  const rawTerms = [
    { term: 'API', shortDef: 'Giao diện lập trình ứng dụng, cho phép các ứng dụng giao tiếp với nhau.', topicId: itTopic },
    { term: 'BIM', shortDef: 'Mô hình thông tin công trình, quy trình tạo lập và quản lý thông tin kỹ thuật.', topicId: bimTopic },
    { term: 'AI', shortDef: 'Trí tuệ nhân tạo, khả năng của máy tính thực hiện các nhiệm vụ thông minh.', topicId: itTopic },
    { term: 'Blockchain', shortDef: 'Công nghệ chuỗi khối, cơ sở dữ liệu phân tán bảo mật cao.', topicId: itTopic },
    { term: 'Cloud Computing', shortDef: 'Điện toán đám mây, cung cấp tài nguyên máy tính qua internet.', topicId: itTopic },
    { term: 'DevOps', shortDef: 'Sự kết hợp giữa phát triển phần mềm và vận hành hệ thống.', topicId: itTopic },
    { term: 'Docker', shortDef: 'Nền tảng container hóa ứng dụng giúp triển khai nhất quán.', topicId: itTopic },
    { term: 'Kubernetes', shortDef: 'Hệ thống điều phối container mã nguồn mở.', topicId: itTopic },
    { term: 'Frontend', shortDef: 'Phần giao diện người dùng của một trang web hoặc ứng dụng.', topicId: itTopic },
    { term: 'Backend', shortDef: 'Phần xử lý logic và cơ sở dữ liệu phía máy chủ.', topicId: itTopic },
    { term: 'Fullstack', shortDef: 'Khả năng làm việc cả frontend và backend.', topicId: itTopic },
    { term: 'Git', shortDef: 'Hệ thống quản lý phiên bản phân tán.', topicId: itTopic },
    { term: 'Agile', shortDef: 'Phương pháp phát triển phần mềm linh hoạt.', topicId: itTopic },
    { term: 'Scrum', shortDef: 'Một khung làm việc trong quy trình Agile.', topicId: itTopic },
    { term: 'SQL', shortDef: 'Ngôn ngữ truy vấn có cấu trúc cho cơ sở dữ liệu.', topicId: itTopic },
    { term: 'NoSQL', shortDef: 'Cơ sở dữ liệu không chỉ sử dụng SQL, linh hoạt về schema.', topicId: itTopic },
    { term: 'Microservices', shortDef: 'Kiến trúc phần mềm chia nhỏ ứng dụng thành các dịch vụ độc lập.', topicId: itTopic },
    { term: 'Serverless', shortDef: 'Mô hình thực thi đám mây không cần quản lý máy chủ.', topicId: itTopic },
    { term: 'IoT', shortDef: 'Internet vạn vật, các thiết bị kết nối mạng.', topicId: itTopic },
    { term: 'Big Data', shortDef: 'Dữ liệu lớn, tập hợp dữ liệu khổng lồ và phức tạp.', topicId: itTopic },
    { term: 'Machine Learning', shortDef: 'Học máy, một lĩnh vực con của AI tập trung vào học từ dữ liệu.', topicId: itTopic },
    { term: 'Deep Learning', shortDef: 'Học sâu, sử dụng mạng thần kinh nhân tạo phức tạp.', topicId: itTopic },
    { term: 'Data Science', shortDef: 'Khoa học dữ liệu, trích xuất tri thức từ dữ liệu.', topicId: itTopic },
    { term: 'Cybersecurity', shortDef: 'An ninh mạng, bảo vệ hệ thống khỏi các cuộc tấn công.', topicId: itTopic },
    { term: 'Firewall', shortDef: 'Tường lửa, rào chắn bảo vệ mạng.', topicId: itTopic },
    { term: 'Encryption', shortDef: 'Mã hóa dữ liệu để bảo vệ quyền riêng tư.', topicId: itTopic },
    { term: 'Decryption', shortDef: 'Giải mã dữ liệu đã được mã hóa.', topicId: itTopic },
    { term: 'Hash Function', shortDef: 'Hàm băm, chuyển đổi dữ liệu thành chuỗi ký tự cố định.', topicId: itTopic },
    { term: 'Virtual Reality', shortDef: 'Thực tế ảo, môi trường giả lập hoàn toàn.', topicId: itTopic },
    { term: 'Augmented Reality', shortDef: 'Thực tế tăng cường, thêm thông tin số vào thế giới thực.', topicId: itTopic },
    { term: 'Metaverse', shortDef: 'Vũ trụ ảo kết nối các không gian 3D.', topicId: itTopic },
    { term: 'Revit', shortDef: 'Phần mềm BIM hàng đầu cho kiến trúc và kỹ thuật.', topicId: bimTopic },
    { term: 'Navisworks', shortDef: 'Công cụ kiểm tra xung đột và quản lý dự án xây dựng.', topicId: bimTopic },
    { term: 'AutoCAD', shortDef: 'Phần mềm vẽ kỹ thuật 2D và 3D phổ biến.', topicId: bimTopic },
    { term: 'IFC', shortDef: 'Định dạng dữ liệu mở cho trao đổi thông tin BIM.', topicId: bimTopic },
    { term: 'Point Cloud', shortDef: 'Tập hợp các điểm dữ liệu 3D từ quét laser.', topicId: bimTopic },
    { term: 'Digital Twin', shortDef: 'Bản sao số của một thực thể vật lý.', topicId: bimTopic },
    { term: 'Clash Detection', shortDef: 'Phát hiện xung đột giữa các bộ phận trong mô hình BIM.', topicId: bimTopic },
    { term: 'LOD', shortDef: 'Mức độ chi tiết của thông tin trong mô hình BIM.', topicId: bimTopic },
    { term: 'Common Data Environment', shortDef: 'Môi trường dữ liệu chung để cộng tác dự án.', topicId: bimTopic },
    { term: 'VDC', shortDef: 'Thiết kế và xây dựng ảo.', topicId: bimTopic },
    { term: 'Lean Construction', shortDef: 'Xây dựng tinh gọn, tối ưu hóa quy trình thi công.', topicId: bimTopic },
    { term: 'Prefabrication', shortDef: 'Tiền chế, chế tạo các bộ phận tại xưởng trước khi lắp ráp.', topicId: bimTopic },
    { term: 'Telemedicine', shortDef: 'Y tế từ xa, khám chữa bệnh qua công nghệ viễn thông.', topicId: healthTopic },
    { term: 'EHR', shortDef: 'Hồ sơ sức khỏe điện tử.', topicId: healthTopic },
    { term: 'PACS', shortDef: 'Hệ thống lưu trữ và truyền hình ảnh y tế.', topicId: healthTopic },
    { term: 'Biotech', shortDef: 'Công nghệ sinh học áp dụng vào y tế và nông nghiệp.', topicId: healthTopic },
    { term: 'Clinical Trials', shortDef: 'Thử nghiệm lâm sàng để đánh giá thuốc hoặc phương pháp mới.', topicId: healthTopic },
    { term: 'Pharmacology', shortDef: 'Dược lý học, nghiên cứu về tác dụng của thuốc.', topicId: healthTopic },
    { term: 'Epidemiology', shortDef: 'Dịch tễ học, nghiên cứu sự phân bố bệnh tật.', topicId: healthTopic },
    { term: 'FinTech', shortDef: 'Công nghệ tài chính, đổi mới trong dịch vụ tài chính.', topicId: financeTopic },
    { term: 'Asset Management', shortDef: 'Quản lý tài sản cho cá nhân hoặc tổ chức.', topicId: financeTopic },
    { term: 'Portfolio', shortDef: 'Danh mục đầu tư tập hợp các tài sản tài chính.', topicId: financeTopic },
    { term: 'Dividend', shortDef: 'Cổ tức, phần lợi nhuận chia cho cổ đông.', topicId: financeTopic },
    { term: 'Bear Market', shortDef: 'Thị trường gấu, giá cổ phiếu có xu hướng giảm.', topicId: financeTopic },
    { term: 'Bull Market', shortDef: 'Thị trường bò, giá cổ phiếu có xu hướng tăng.', topicId: financeTopic },
    { term: 'IPO', shortDef: 'Phát hành cổ phiếu lần đầu ra công chúng.', topicId: financeTopic },
    { term: 'Venture Capital', shortDef: 'Vốn mạo hiểm đầu tư vào các khởi nghiệp tiềm năng.', topicId: financeTopic },
    { term: 'Hedge Fund', shortDef: 'Quỹ phòng hộ sử dụng các chiến lược đầu tư phức tạp.', topicId: financeTopic },
    { term: 'Inflation', shortDef: 'Lạm phát, sự tăng giá hàng hóa và dịch vụ theo thời gian.', topicId: financeTopic },
    { term: 'Cryptocurrency', shortDef: 'Tiền mã hóa dựa trên công nghệ blockchain.', topicId: financeTopic },
    { term: 'Stablecoin', shortDef: 'Tiền điện tử có giá trị gắn với tài sản ổn định như USD.', topicId: financeTopic },
    { term: 'DeFi', shortDef: 'Tài chính phi tập trung, loại bỏ trung gian tài chính truyền thống.', topicId: financeTopic },
    { term: 'Smart Contract', shortDef: 'Hợp đồng thông minh tự thực thi trên blockchain.', topicId: financeTopic },
    { term: 'NFT', shortDef: 'Tài sản kỹ thuật số không thể thay thế.', topicId: financeTopic },
    { term: 'Responsive Design', shortDef: 'Thiết kế đáp ứng, hiển thị tốt trên mọi thiết bị.', topicId: itTopic },
    { term: 'SEO', shortDef: 'Tối ưu hóa công cụ tìm kiếm.', topicId: itTopic },
    { term: 'UI', shortDef: 'Giao diện người dùng.', topicId: itTopic },
    { term: 'UX', shortDef: 'Trải nghiệm người dùng.', topicId: itTopic },
    { term: 'CMS', shortDef: 'Hệ thống quản lý nội dung.', topicId: itTopic },
    { term: 'SaaS', shortDef: 'Phần mềm dưới dạng dịch vụ.', topicId: itTopic },
    { term: 'PaaS', shortDef: 'Nền tảng dưới dạng dịch vụ.', topicId: itTopic },
    { term: 'IaaS', shortDef: 'Hạ tầng dưới dạng dịch vụ.', topicId: itTopic },
    { term: 'API Gateway', shortDef: 'Điểm quản lý duy nhất cho các yêu cầu API.', topicId: itTopic },
    { term: 'Load Balancer', shortDef: 'Cân bằng tải giữa các máy chủ.', topicId: itTopic },
    { term: 'CDN', shortDef: 'Mạng lưới phân phối nội dung giúp tải web nhanh hơn.', topicId: itTopic },
    { term: 'Cache', shortDef: 'Bộ nhớ đệm lưu trữ dữ liệu tạm thời.', topicId: itTopic },
    { term: 'Latency', shortDef: 'Độ trễ trong quá trình truyền dữ liệu.', topicId: itTopic },
    { term: 'Bandwidth', shortDef: 'Băng thông, lượng dữ liệu tối đa truyền tải được.', topicId: itTopic },
    { term: 'Cookie', shortDef: 'Tệp nhỏ lưu thông tin người dùng trên trình duyệt.', topicId: itTopic },
    { term: 'Token', shortDef: 'Mã định danh bảo mật dùng cho xác thực.', topicId: itTopic },
    { term: 'OAuth', shortDef: 'Giao thức ủy quyền chuẩn mở.', topicId: itTopic },
    { term: 'JWT', shortDef: 'JSON Web Token, chuẩn truyền tin an toàn giữa các bên.', topicId: itTopic },
    { term: 'Redux', shortDef: 'Thư viện quản lý trạng thái cho ứng dụng JavaScript.', topicId: itTopic },
    { term: 'React', shortDef: 'Thư viện JavaScript để xây dựng giao diện người dùng.', topicId: itTopic },
    { term: 'Next.js', shortDef: 'Khung làm việc React hỗ trợ SSR và tĩnh.', topicId: itTopic },
    { term: 'TypeScript', shortDef: 'Siêu tập của JavaScript có kiểm tra kiểu dữ liệu mạnh.', topicId: itTopic },
    { term: 'Node.js', shortDef: 'Môi trường thực thi JavaScript phía máy chủ.', topicId: itTopic },
    { term: 'Express', shortDef: 'Khung làm việc web tối giản cho Node.js.', topicId: itTopic },
    { term: 'Prisma', shortDef: 'ORM thế hệ mới cho Node.js và TypeScript.', topicId: itTopic },
    { term: 'Tailwind CSS', shortDef: 'Khung làm việc CSS ưu tiên tiện ích.', topicId: itTopic },
    { term: 'PostgreSQL', shortDef: 'Hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ.', topicId: itTopic },
    { term: 'MongoDB', shortDef: 'Cơ sở dữ liệu hướng tài liệu NoSQL.', topicId: itTopic },
    { term: 'Redis', shortDef: 'Cơ sở dữ liệu lưu trữ trong bộ nhớ cho tốc độ cực cao.', topicId: itTopic },
    { term: 'GraphQL', shortDef: 'Ngôn ngữ truy vấn dữ liệu cho API.', topicId: itTopic },
    { term: 'Webhook', shortDef: 'Cách ứng dụng gửi thông tin tự động khi có sự kiện.', topicId: itTopic },
    { term: 'Unit Test', shortDef: 'Kiểm thử đơn vị, kiểm tra phần nhỏ nhất của code.', topicId: itTopic },
    { term: 'Integration Test', shortDef: 'Kiểm thử tích hợp các thành phần với nhau.', topicId: itTopic },
    { term: 'CI/CD', shortDef: 'Tích hợp và triển khai liên tục.', topicId: itTopic },
    { term: 'Web3', shortDef: 'Thế hệ web phi tập trung dựa trên blockchain.', topicId: itTopic },
  ];

  for (const t of rawTerms) {
    const slug = generateSlug(t.term);
    await db.glossaryTerm.upsert({
      where: { slug },
      update: {
        term: t.term,
        shortDef: t.shortDef,
        definition: `${t.shortDef}\n\nĐây là định nghĩa chi tiết cho thuật ngữ **${t.term}**. Trong chuyên ngành, thuật ngữ này đóng vai trò rất quan trọng và được sử dụng rộng rãi trong các tài liệu kỹ thuật.\n\n### Đặc điểm chính\n- Dễ hiểu và phổ biến.\n- Có tính ứng dụng cao.\n- Cần nắm rõ khi làm việc chuyên môn.`,
        topicId: t.topicId || null,
      },
      create: {
        slug,
        term: t.term,
        shortDef: t.shortDef,
        definition: `${t.shortDef}\n\nĐây là định nghĩa chi tiết cho thuật ngữ **${t.term}**. Trong chuyên ngành, thuật ngữ này đóng vai trò rất quan trọng và được sử dụng rộng rãi trong các tài liệu kỹ thuật.\n\n### Đặc điểm chính\n- Dễ hiểu và phổ biến.\n- Có tính ứng dụng cao.\n- Cần nắm rõ khi làm việc chuyên môn.`,
        topicId: t.topicId || null,
      },
    });
  }

  console.log(`✅ Successfully seeded ${rawTerms.length} terms.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
