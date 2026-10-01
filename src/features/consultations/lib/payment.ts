/* Bank-transfer payments for consultations: the system account, payment codes and VietQR. */

/** Common Vietnamese banks with their NAPAS BIN (what VietQR expects). */
export const BANKS = [
  { bin: '970436', short: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { bin: '970415', short: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam' },
  { bin: '970418', short: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', short: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
  { bin: '970407', short: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { bin: '970422', short: 'MB Bank', name: 'Ngân hàng TMCP Quân đội' },
  { bin: '970416', short: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', short: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970423', short: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', short: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970437', short: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { bin: '970441', short: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970443', short: 'SHB', name: 'Ngân hàng TMCP Sài Gòn – Hà Nội' },
  { bin: '970431', short: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { bin: '970426', short: 'MSB', name: 'Ngân hàng TMCP Hàng Hải' },
  { bin: '970448', short: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970440', short: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á' },
  { bin: '970449', short: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { bin: '970428', short: 'Nam A Bank', name: 'Ngân hàng TMCP Nam Á' },
  { bin: '970425', short: 'ABBANK', name: 'Ngân hàng TMCP An Bình' },
  { bin: '970454', short: 'BVBank', name: 'Ngân hàng TMCP Bản Việt' },
  { bin: '970452', short: 'KienlongBank', name: 'Ngân hàng TMCP Kiên Long' },
] as const;

export type PaymentAccount = {
  /** NAPAS BIN, one of BANKS. */
  bankBin: string;
  accountNumber: string;
  /** Account holder as printed by the bank (uppercase, no diacritics). */
  accountName: string;
};

export const PAYMENT_CONFIG_KEY = 'consultation_payment';
/** Unreported holds are released after this long; once the guest reports the transfer the hold stays until an admin acts. */
export const PAYMENT_HOLD_MINUTES = 30;
export const PRICE_MAX = 50_000_000;

export const bankOf = (bin: string) => BANKS.find(b => b.bin === bin);

/** Bank-style holder name: uppercase ASCII letters and spaces. */
export function normalizeAccountName(raw: string) {
  return raw.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim();
}

export function parsePaymentAccount(input: unknown): { ok: true; account: PaymentAccount } | { ok: false; error: string } {
  const v = (input ?? {}) as Partial<Record<keyof PaymentAccount, unknown>>;
  const bankBin = String(v.bankBin ?? '');
  const accountNumber = String(v.accountNumber ?? '').replace(/\s+/g, '');
  const accountName = normalizeAccountName(String(v.accountName ?? ''));
  if (!bankOf(bankBin)) return { ok: false, error: 'Hãy chọn ngân hàng' };
  if (!/^[0-9]{6,19}$/.test(accountNumber)) return { ok: false, error: 'Số tài khoản gồm 6–19 chữ số' };
  if (accountName.length < 3 || accountName.length > 60) return { ok: false, error: 'Tên chủ tài khoản không hợp lệ' };
  return { ok: true, account: { bankBin, accountNumber, accountName } };
}

/** Avoids look-alikes (0/O, 1/I) so codes survive being typed into a banking app. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** e.g. "LN7K4Q9X" — letters/digits only, since banks strip punctuation from transfer messages. */
export function generatePaymentCode(random: (max: number) => number) {
  let code = 'LN';
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}

/** Quick-pay QR (VietQR) prefilled with account, amount and the code as the message. */
export function vietQrUrl(account: PaymentAccount, amount?: number, code?: string) {
  const q = new URLSearchParams({ ...(amount && { amount: String(amount) }), ...(code && { addInfo: code }), accountName: account.accountName });
  return `https://img.vietqr.io/image/${account.bankBin}-${account.accountNumber}-compact2.png?${q}`;
}

export const formatVnd = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`;
