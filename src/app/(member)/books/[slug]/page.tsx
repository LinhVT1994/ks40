import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';

// Tạm thời tắt — xóa dòng notFound() phía dưới để bật lại
import { ChevronRight, Globe, Lock, PlayCircle, MessageSquare, Info, Star, Users, CheckCircle2, Clock } from 'lucide-react';
import BookHero from '@/features/member/components/BookHero';
import TestimonialsCarousel from '@/features/member/components/TestimonialsCarousel';
import { getBookBySlugAction } from '@/features/member/actions/book';

export default async function BookLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  notFound(); // tạm thời tắt
  const book = (await getBookBySlugAction(slug))!;

  return (
    <div className="min-h-screen">
      <BookHero book={{ ...book, _count: { chapters: book.chapters.length } } as any} />

      <section className="px-5 md:px-12 py-16 md:py-24 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start relative">

          {/* Main Content: Chapters */}
          <div className="lg:col-span-8 space-y-12 md:space-y-20">
            <div>
               <h2 className="text-3xl md:text-4xl font-black text-zinc-800 dark:text-white font-display mb-6 tracking-tight">
                 Lộ trình học tập
               </h2>
               <p className="text-lg md:text-xl text-zinc-500 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
                 Chương trình được thiết kế bài bản theo trình tự từ cơ bản đến chuyên sâu, giúp bạn làm chủ Senior Frontend một cách bền vững.
               </p>
            </div>

            <div className="space-y-0 border-t border-zinc-200 dark:border-white/5">
               {book.chapters.map((chapter) => (
                 <Link
                   key={chapter.id}
                   href={`/books/${book.slug}/${chapter.slug}`}
                   className="flex items-center gap-5 md:gap-8 py-7 md:py-8 border-b border-zinc-200 dark:border-white/5 transition-all group px-4 -mx-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                 >
                   <div className="text-2xl font-black text-zinc-200 dark:text-slate-800 w-10 shrink-0 group-hover:text-primary/40 transition-colors tabular-nums">
                      {chapter.order < 10 ? `0${chapter.order}` : chapter.order}
                   </div>

                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                         <h3 className="text-lg md:text-xl font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors truncate tracking-tight">
                           {chapter.title}
                         </h3>
                         {chapter.isFree && (
                           <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-wider border border-emerald-500/10">FREE</span>
                         )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500 dark:text-slate-500 uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> Video</span>
                         <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-slate-800" />
                         <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {chapter.readTime}m</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-6 shrink-0">
                      {!chapter.isFree && <Lock className="w-4 h-4 text-zinc-300 dark:text-slate-700" />}
                      <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                   </div>
                 </Link>
               ))}
            </div>

            <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-600 via-primary to-blue-500 rounded-[2.5rem] md:rounded-[4rem] flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden group shadow-2xl shadow-primary/20 border-none">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-white/20 transition-colors" />
               <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

               <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] bg-white/10 backdrop-blur-xl max-md:backdrop-blur-lg border border-white/20 flex items-center justify-center text-white shrink-0 shadow-2xl relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                  <Star className="w-10 h-10 md:w-12 md:h-12 fill-current" />
               </div>
               <div className="flex-1 text-center md:text-left relative z-10 space-y-3 md:space-y-4">
                  <h4 className="text-2xl md:text-3xl font-black text-white font-display tracking-tight leading-tight">Bạn đã sẵn sàng nâng tầm kỹ năng?</h4>
                  <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl font-medium">
                     Tham gia cùng hơn 2,500 học viên khác. Mở khóa toàn bộ nội dung chuyên sâu và nhận hỗ trợ trực tiếp từ tác giả.
                  </p>
               </div>
               <button className="w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-white text-primary rounded-2xl md:rounded-[2rem] text-xs md:text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:scale-[1.05] active:scale-95 transition-all whitespace-nowrap relative z-10">
                  Gia nhập ngay
               </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-10">
            {/* Author Card */}
            <div className="p-10 bg-white dark:bg-white/[0.02] border border-zinc-300/60 dark:border-white/5 rounded-[3rem] shadow-sm flex flex-col items-center text-center group hover:border-primary/20 transition-all duration-700 backdrop-blur-xl max-md:backdrop-blur-lg">
               <div className="relative mb-8">
                 <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-primary via-blue-500 to-indigo-600 group-hover:rotate-12 transition-transform duration-700 ring-4 ring-primary/5">
                    <div className="relative w-full h-full rounded-full border-4 border-white dark:border-slate-950 overflow-hidden shadow-2xl">
                       <Image src={book.author.image || '/placeholder-avatar.jpg'} alt={book.author.name} fill sizes="112px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                 </div>
                 <div className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full flex items-center justify-center text-white shadow-xl transform translate-x-1 translate-y-1">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
               </div>

               <h3 className="text-2xl font-black text-zinc-800 dark:text-white font-display mb-1.5 tracking-tight">{book.author.name}</h3>

               {book.author.bio && (
                 <p className="text-base text-zinc-500 dark:text-slate-400 leading-relaxed mb-10 px-4 font-medium italic">
                    &ldquo;{book.author.bio}&rdquo;
                 </p>
               )}

               <button className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-slate-950 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.25em] hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none flex items-center justify-center gap-3 active:scale-95">
                 <MessageSquare className="w-5 h-5" /> Liên hệ tác giả
               </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-5">
               <div className="p-8 bg-white dark:bg-white/[0.02] border border-zinc-300/60 dark:border-white/5 rounded-[2.5rem] text-center hover:border-primary/20 transition-all group shadow-sm active:scale-95">
                  <div className="text-3xl font-black text-zinc-800 dark:text-white mb-1 group-hover:text-primary transition-colors tracking-tighter">2.4k</div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" /> Students
                  </div>
               </div>
               <div className="p-8 bg-white dark:bg-white/[0.02] border border-zinc-300/60 dark:border-white/5 rounded-[2.5rem] text-center hover:border-primary/20 transition-all group shadow-sm active:scale-95">
                  <div className="text-3xl font-black text-zinc-800 dark:text-white mb-1 group-hover:text-primary transition-colors tracking-tighter">4.9/5</div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 fill-current" /> Rating
                  </div>
               </div>
            </div>

            {/* Support Box */}
            <div className="p-10 bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-white/5 rounded-[3rem] relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700" />

               <div className="relative z-10">
                 <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-zinc-200 dark:border-white/5 shadow-sm">
                   <Info className="w-7 h-7 text-primary" />
                 </div>
                 <h4 className="text-2xl font-black text-zinc-800 dark:text-white mb-4 font-display tracking-tight">Tư vấn hỗ trợ</h4>
                 <p className="text-base text-zinc-500 dark:text-slate-400 leading-relaxed mb-10 font-medium">
                   Nếu bạn cần hỗ trợ về lộ trình học tập, đừng ngần ngại chat với đội ngũ chuyên gia của chúng tôi.
                 </p>
                 <button className="w-full py-5 bg-zinc-800 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-zinc-800/10 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all">
                   Chat với Support
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof (Testimonials) Section */}
      <TestimonialsCarousel />
    </div>
  );
}
