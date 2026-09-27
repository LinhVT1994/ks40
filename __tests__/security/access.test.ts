import { describe, expect, it } from 'vitest';
import { canAccessAudience, canDownloadArticle } from '@/lib/access';
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown-editor';
import JsonLd from '@/components/shared/JsonLd';

describe('audience authorization', () => {
  it.each([
    [undefined, [true, false, false, false]],
    ['MEMBER', [true, true, false, false]],
    ['PREMIUM', [true, true, true, false]],
    ['ADMIN', [true, true, true, true]],
    ['invalid', [true, false, false, false]],
  ] as const)('checks role %s', (role, expected) => {
    expect(['PUBLIC', 'MEMBERS', 'PREMIUM', 'PRIVATE'].map(a => canAccessAudience(a, role))).toEqual(expected);
    expect(canAccessAudience('invalid', role)).toBe(false);
  });
  it('does not publish draft attachments to guests or members', () => {
    for (const role of [undefined, 'MEMBER', 'PREMIUM']) {
      expect(canDownloadArticle({ status: 'DRAFT', audience: 'PUBLIC' }, role)).toBe(false);
    }
    expect(canDownloadArticle({ status: 'DRAFT', audience: 'PRIVATE' }, 'ADMIN')).toBe(true);
  });
});

describe('HTML output', () => {
  it('preserves literal angle brackets and ampersands when notes are edited again', () => {
    const text = 'a < b & c > d';
    expect(htmlToMarkdown(markdownToHtml(text))).toBe(text);
  });
  it('escapes script termination inside JSON-LD', () => {
    const data = { name: '</script><script>alert(1)</script>' };
    const html = JsonLd({ data }).props.dangerouslySetInnerHTML.__html;
    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual(data);
  });
  it('escapes raw HTML and image attributes in scratchpad content', () => {
    expect(markdownToHtml('<img src=x onerror=alert(1)>')).not.toContain('<img');
    expect(markdownToHtml('![](javascript:alert(1))')).not.toContain('<img');
    expect(markdownToHtml('![](https://example.test/a"onerror="alert)')).not.toContain('src="https://example.test/a"');
    expect(markdownToHtml('**hello**')).toBe('<b>hello</b>');
    expect(markdownToHtml('![](/uploads/image.png)')).toContain('<img src="/uploads/image.png"');
  });
});
