"use client";

import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RelatedDocs() {
  const related = [
    {
      title: "Tối ưu hóa API Gateway",
      description: "Quản lý luồng dữ liệu và bảo mật cho Microservices.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf5jAbQKdwbM-r6UqXlbxR7kz15Ppd0lEaHmu-F9nmdglTKbdB5TKVd0VFK8kwT2q22-xV17FscMPghkoKdJfYlNQDQkP9olf63q8hebpcs4gXQTMGFOMGluAnnXsyfKUpsPbOi-Frpzt_fXxKsFQshEu63VSkpdv1Pj_Q1UtceAPYznBV2Ws9nzpjdhh4E13eRnrueCpHbNHY8MHmOqEuVtGSnUSL3G-x84mBYsTn05BLK73hWAN-HmN8iccKEk21tAcNzT5Eeg",
    },
    {
      title: "Docker & Kubernetes 101",
      description: "Lộ trình làm chủ container orchestration cơ bản.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuADQgBIrkXb5h-tqA5rvxNaicWH7Nw1gvaREoetX2yZP6leBDtUdB70jrP30Ad_NLqz77u_LNpyOLCxJ-Ihaj90vzfEi94cmXGbQwc0YcIG6VmCeimr265d4SncdtuAQCu2hHI6ulLoqSNYQhf9IYyesPizQliMfwjFmMdviEgO-h9ThluVfq7a3ligsDs0Az2fjpBUbPZu4WDyAeYQDAfXDg9D3oMhMiM2vshmhbFt7oziiuOW5kyYfX_aiFExPbhxHIkfGVOMLA",
    },
    {
      title: "Hệ thống phân tán thực chiến",
      description: "Xây dựng hệ thống High availability quy mô lớn.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPBJl75jYJLUXw2dsr34U_V3GTCEX9SbN4sW1zbQxMMWGA2pe5PIU5BkyM-k0bkQmDHG88Ayyo84ZldBnp-7bea6t5ROHPESrzkHZwuBcjuQ5PYY2M4rRsDfGKiVgnRLDXiMn90O5YX6jC94uO0APKI3TxY5cEHLcwmL20EnCZsddmB1rakFRrYWzNN576UsN-5Pw-FKKVJgBHb2l4jJ6e3-sK3O2bqf9P8qI4FsRnQZ9EC3ndO0m2uGAeq-9GYKlq8xd11I1c3g",
    }
  ];

  return (
    <div className="w-full transition-all duration-300">
      <div className="flex items-center gap-2 mb-4 px-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Liên quan</h3>
      </div>
      
      <div className="flex flex-col gap-1">
        {related.map((doc, i) => (
          <Link href={`/article/related-${i}`} key={i} className="block group">
            <div className="flex gap-3 cursor-pointer p-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-white/5">
              <div className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border border-zinc-200 dark:border-white/5 overflow-hidden transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${doc.img}')` }}>
                <div className="w-full h-full bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-[13px] font-bold text-zinc-800 dark:text-white truncate group-hover:text-primary transition-colors leading-tight mb-1.5">{doc.title}</h4>
                <p className="text-[11px] text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-slate-300 transition-colors line-clamp-2 leading-relaxed">{doc.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <button className="w-full mt-4 py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-all text-left flex items-center justify-between group border-t border-zinc-200 dark:border-white/5 pt-6 mt-6">
        <span>Khám phá thêm</span>
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
