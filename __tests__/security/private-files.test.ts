import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { downloadStoredFile } from '@/lib/private-files';
it.each([
  '/uploads/files/../../.env', '/uploads/shared/%2e%2e/secret.pdf',
  'private:files/../secret.pdf', 'private:/etc/passwd', 'file:///etc/passwd',
  'http://127.0.0.1/secret', 'data:text/html,<script>alert(1)</script>',
])('rejects unsafe storage reference %s', async url => {
  await expect(downloadStoredFile({ url, name: 'file' })).rejects.toThrow('Invalid storage key');
});
