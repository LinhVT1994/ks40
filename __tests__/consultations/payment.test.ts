import { describe, expect, it } from 'vitest';
import { generatePaymentCode, normalizeAccountName, parsePaymentAccount, vietQrUrl } from '@/features/consultations/lib/payment';

describe('generatePaymentCode', () => {
  it('is LN + 6 unambiguous characters', () => {
    let i = 0;
    const code = generatePaymentCode(max => (i++ * 7) % max);
    expect(code).toMatch(/^LN[A-HJ-NP-Z2-9]{6}$/);
  });
  it('never contains look-alikes (0, O, 1, I)', () => {
    for (let n = 0; n < 200; n++) expect(generatePaymentCode(max => Math.floor(Math.random() * max)).slice(2)).not.toMatch(/[01OI]/);
  });
});

describe('normalizeAccountName', () => {
  it('uppercases and strips Vietnamese diacritics', () => {
    expect(normalizeAccountName('  Nguyễn Văn   Đức ')).toBe('NGUYEN VAN DUC');
  });
});

describe('parsePaymentAccount', () => {
  it('accepts a known bank, digits and a name', () => {
    expect(parsePaymentAccount({ bankBin: '970436', accountNumber: '0123 456 789', accountName: 'Lê Thị Hoa' }))
      .toEqual({ ok: true, account: { bankBin: '970436', accountNumber: '0123456789', accountName: 'LE THI HOA' } });
  });
  it('rejects an unknown bank, a bad number or an empty name', () => {
    expect(parsePaymentAccount({ bankBin: '000000', accountNumber: '0123456789', accountName: 'A B C' }).ok).toBe(false);
    expect(parsePaymentAccount({ bankBin: '970436', accountNumber: '12ab', accountName: 'A B C' }).ok).toBe(false);
    expect(parsePaymentAccount({ bankBin: '970436', accountNumber: '0123456789', accountName: '' }).ok).toBe(false);
    expect(parsePaymentAccount(null).ok).toBe(false);
  });
});

describe('vietQrUrl', () => {
  const account = { bankBin: '970436', accountNumber: '0123456789', accountName: 'LE THI HOA' };
  it('encodes amount and code as the transfer message', () => {
    const url = new URL(vietQrUrl(account, 200000, 'LNABC234'));
    expect(url.origin + url.pathname).toBe('https://img.vietqr.io/image/970436-0123456789-compact2.png');
    expect(url.searchParams.get('amount')).toBe('200000');
    expect(url.searchParams.get('addInfo')).toBe('LNABC234');
    expect(url.searchParams.get('accountName')).toBe('LE THI HOA');
  });
  it('omits amount and message for a plain preview', () => {
    const url = new URL(vietQrUrl(account));
    expect(url.searchParams.has('amount')).toBe(false);
    expect(url.searchParams.has('addInfo')).toBe(false);
  });
});
