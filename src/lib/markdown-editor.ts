export const htmlToMarkdown = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<img.*?src=["'](.*?)["'].*?>/g, '![]($1)')
    .replace(/<h3.*?>([\s\S]*?)<\/h3>/gi, '### $1\n')
    .replace(/<blockquote.*?>([\s\S]*?)<\/blockquote>/gi, '> $1\n')
    .replace(/<ol.*?>([\s\S]*?)<\/ol>/gi, (_, content: string) => {
      let i = 1;
      return content.replace(/<li.*?>([\s\S]*?)<\/li>/gi, (_, item) => `${i++}. ${item.trim()}\n`);
    })
    .replace(/<ul.*?>([\s\S]*?)<\/ul>/gi, (_, content: string) => {
      return content.replace(/<li.*?>([\s\S]*?)<\/li>/gi, (_, item) => `- ${item.trim()}\n`);
    })
    .replace(/<li.*?>([\s\S]*?)<\/li>/gi, (_, item) => `- ${item.trim()}\n`)
    .replace(/<b.*?>([\s\S]*?)<\/b>/gi, '**$1**').replace(/<strong.*?>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<i.*?>([\s\S]*?)<\/i>/gi, '*$1*').replace(/<em.*?>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<a.*?href=["'](.*?)["'].*?>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<hr.*?>/gi, '\n---\n')
    .replace(/<div><br><\/div>/g, '\n').replace(/<div>/g, '\n').replace(/<\/div>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>?/gm, '') // Final strip of any remaining HTML tags
    .replace(/&nbsp;/g, ' ').replace(/\n\n+/g, '\n\n').trim();
};

export const markdownToHtml = (md: string) => {
  if (!md) return '';
  
  let html = md
    .replace(/!\[\]\((.*?)\)/g, '<img src="$1" style="max-width:100%; border-radius:12px; margin: 12px 0; border: 1px solid rgba(0,0,0,0.05);" />')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/### (.*?)\n/g, '<h3>$1</h3>')
    .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>')
    .replace(/^---\s*$/gm, '<hr>');

  // Handle unordered lists (- or *)
  html = html.replace(/^[-*] (.*$)/gm, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, ''); // Merge adjacent <ul> tags
  
  // Handle ordered lists (1. 2. 3.)
  html = html.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
  html = html.replace(/<\/ol>\s*<ol>/g, ''); // Merge adjacent <ol> tags

  return html.replace(/\n/g, '<br>')
    .replace(/(<br>\s*)+<ul>/g, '<ul>')
    .replace(/(<br>\s*)+<ol>/g, '<ol>')
    .replace(/(<br>\s*)+<blockquote>/g, '<blockquote>')
    .replace(/(<br>\s*)+<h3>/g, '<h3>')
    .replace(/(<br>\s*)+<hr>/g, '<hr>');
};
