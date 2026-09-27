// Synthetic visual fixtures; no database, account data or network access required.
import React from 'react';
import { ImageResponse } from 'next/og';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ProfileShareCard from '../src/components/shared/ProfileShareCard';

async function main() {
  const directory = await mkdtemp(path.join(tmpdir(), 'lenote-profile-og-'));
  const [serif, sans] = await Promise.all([
    readFile('src/assets/fonts/GentiumBookPlus-Regular.ttf'),
    readFile('src/assets/fonts/BeVietnamPro-Regular.ttf'),
  ]);
  const samples = [
    { id: 'preview', username: 'minhanh', name: 'Nguyễn Minh Anh', bio: 'Ghi chép về công nghệ, những cuốn sách hay và hành trình học mỗi ngày.', image: null },
    { id: 'fallback', username: null, name: null, bio: null, image: null },
    { id: 'long', username: 'mot_ten_nguoi_dung_rat_dai', name: 'Nguyễn Hoàng Phương Anh và những câu chuyện trên hành trình học hỏi', bio: 'Một đoạn giới thiệu rất dài để kiểm tra khả năng xuống dòng và cắt chữ mà không chồng lấn lên phần chân của thẻ tác giả trên Lenote.', image: null },
  ];
  for (const user of samples) {
    const image = new ImageResponse(<ProfileShareCard user={user} avatar={null} />, { width: 1200, height: 630, fonts: [
      { name: 'Gentium', data: serif, weight: 400, style: 'normal' },
      { name: 'BeVietnam', data: sans, weight: 400, style: 'normal' },
    ] });
    const filename = path.join(directory, `${user.id}.png`);
    await writeFile(filename, Buffer.from(await image.arrayBuffer()));
    console.log(filename);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
