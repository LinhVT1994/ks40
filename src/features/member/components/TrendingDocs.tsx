"use client";

import { TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';

export default function TrendingDocs() {
  const trending = [
    {
      title: "UI Design Patterns",
      likes: "1.2k",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf5jAbQKdwbM-r6UqXlbxR7kz15Ppd0lEaHmu-F9nmdglTKbdB5TKVd0VFK8kwT2q22-xV17FscMPghkoKdJfYlNQDQkP9olf63q8hebpcs4gXQTMGFOMGluAnnXsyfKUpsPbOi-Frpzt_fXxKsFQshEu63VSkpdv1Pj_Q1UtceAPYznBV2Ws9nzpjdhh4E13eRnrueCpHbNHY8MHmOqEuVtGSnUSL3G-x84mBYsTn05BLK73hWAN-HmN8iccKEk21tAcNzT5Eeg",
    },
    {
      title: "React Server Components",
      likes: "856",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuADQgBIrkXb5h-tqA5rvxNaicWH7Nw1gvaREoetX2yZP6leBDtUdB70jrP30Ad_NLqz77u_LNpyOLCxJ-Ihaj90vzfEi94cmXGbQwc0YcIG6VmCeimr265d4SncdtuAQCu2hHI6ulLoqSNYQhf9IYyesPizQliMfwjFmMdviEgO-h9ThluVfq7a3ligsDs0Az2fjpBUbPZu4WDyAeYQDAfXDg9D3oMhMiM2vshmhbFt7oziiuOW5kyYfX_aiFExPbhxHIkfGVOMLA",
    },
    {
      title: "Next.js 15 Guide",
      likes: "642",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPBJl75jYJLUXw2dsr34U_V3GTCEX9SbN4sW1zbQxMMWGA2pe5PIU5BkyM-k0bkQmDHG88Ayyo84ZldBnp-7bea6t5ROHPESrzkHZwuBcjuQ5PYY2M4rRsDfGKiVgnRLDXiMn90O5YX6jC94uO0APKI3TxY5cEHLcwmL20EnCZsddmB1rakFRrYWzNN576UsN-5Pw-FKKVJgBHb2l4jJ6e3-sK3O2bqf9P8qI4FsRnQZ9EC3ndO0m2uGAeq-9GYKlq8xd11I1c3g",
    }
  ];

  return (
    <div className="w-full transition-all duration-300">
      <div className="flex items-center gap-2 mb-4 px-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Xu hướng</h3>
      </div>
      
      <div className="flex flex-col gap-1">
        {trending.map((doc, i) => (
          <Link href={`/article/${i}`} key={i} className="block group">
            <div className="flex gap-3 cursor-pointer p-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 rounded-xl">
              <div className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${doc.img}')` }}>
                <div className="w-full h-full bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white truncate group-hover:text-primary transition-colors leading-tight mb-1.5">{doc.title}</h4>
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="flex items-center gap-1 group/like">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10 group-hover/like:fill-rose-500 transition-all" />
                    <span className="text-[11px] font-semibold">{doc.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <button className="w-full mt-4 py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-all text-left group">
        <span className="inline-block transition-transform group-hover:translate-x-1">Xem tất cả tài liệu &rarr;</span>
      </button>
    </div>
  );
}
