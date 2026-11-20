/**
 * UUID v7 generator (RFC 9562).
 * Millisekund timestamp + pseudo-random baytlar.
 * Node.js va Brauzerda tashqi kutubxonalarsiz ishlaydi.
 */
export function generateUUIDv7(): string {
  const msecs = Date.now();
  const hex = [
    Math.floor(msecs / 0x100000000).toString(16).padStart(8, '0'),
    (msecs & 0xffff).toString(16).padStart(4, '0'),
    (0x7000 | Math.floor(Math.random() * 0x0fff)).toString(16).padStart(4, '0'),
    (0x8000 | Math.floor(Math.random() * 0x3fff)).toString(16).padStart(4, '0'),
    Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join(''),
  ];
  return hex.join('-');
}

export function isValidUUIDv7(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export function getTimestampFromUUIDv7(uuid: string): number {
  const hex = uuid.replace(/-/g, '').slice(0, 12);
  return parseInt(hex, 16);
}
