/**
 * Standart Termal Printer (ESC/POS) buyruqlari va qator formatlovchisi
 */

export const ESC_POS = {
  INIT: '\x1b@',
  ALIGN_LEFT: '\x1ba\x00',
  ALIGN_CENTER: '\x1ba\x01',
  ALIGN_RIGHT: '\x1ba\x02',
  BOLD_ON: '\x1bE\x01',
  BOLD_OFF: '\x1bE\x00',
  DOUBLE_ON: '\x1d!\x11', // Katta o'lcham (balandlik va kenglik 2x)
  DOUBLE_HEIGHT: '\x1d!\x01',
  DOUBLE_OFF: '\x1d!\x00',
  CUT_FULL: '\x1di',
  CUT_PARTIAL: '\x1dm',
  DRAWER_KICK: '\x1bp\x00\x19\xfa', // Kassa tortmasini ochish
};

/**
 * 2 ustunli matnni kenglik bo'yicha to'g'irlash: "Osh (1 porsiya) ......... 35 000"
 */
export function formatTwoColumns(
  left: string,
  right: string,
  width: 58 | 80 = 80,
): string {
  const maxLen = width === 58 ? 32 : 42;
  const leftTrimmed = left.slice(0, maxLen - right.length - 1);
  const spaceCount = Math.max(1, maxLen - leftTrimmed.length - right.length);
  return `${leftTrimmed}${' '.repeat(spaceCount)}${right}`;
}

/**
 * Ajratuvchi chiziq (--- yoki ===)
 */
export function formatDivider(char = '-', width: 58 | 80 = 80): string {
  const maxLen = width === 58 ? 32 : 42;
  return char.repeat(maxLen);
}

/**
 * O'rtaga tekislangan matn
 */
export function formatCentered(text: string, width: 58 | 80 = 80): string {
  const maxLen = width === 58 ? 32 : 42;
  if (text.length >= maxLen) return text.slice(0, maxLen);
  const pad = Math.floor((maxLen - text.length) / 2);
  return `${' '.repeat(pad)}${text}`;
}
