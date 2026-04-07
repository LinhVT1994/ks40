export function slugify(text: string): string {
  return text
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics (decomposes Vietnamese vowels)
    .replace(/[đĐ]/g, 'd')             // Vietnamese đ not caught by NFKD
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'heading';
}

export function parseHeadings(content: string): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  let inCodeBlock = false;

  for (const line of content.split('\n')) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    const m2 = line.match(/^## (.+)/);
    const m3 = line.match(/^### (.+)/);
    if (m2) {
      const text = m2[1].trim();
      headings.push({ level: 2, text, id: slugify(text) });
    } else if (m3) {
      const text = m3[1].trim();
      headings.push({ level: 3, text, id: slugify(text) });
    }
  }

  return headings;
}
