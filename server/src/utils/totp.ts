import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

const base32ToBuffer = (value: string): Buffer => {
  const normalized = value
    .replace(/=+$/g, "")
    .toUpperCase()
    .replace(/\s+/g, "");
  let bits = "";
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid base32 secret");
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
};

const bufferToBase32 = (buffer: Buffer): string => {
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
  }

  return output;
};

const hotp = (secret: string, counter: number): string => {
  const key = base32ToBuffer(secret);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));

  const hash = crypto.createHmac("sha1", key).update(message).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
};

export const generateTotpSecret = (byteLength = 20): string => {
  return bufferToBase32(crypto.randomBytes(byteLength));
};

export const generateTotpCode = (
  secret: string,
  timestamp = Date.now(),
): string => {
  const counter = Math.floor(timestamp / 1000 / STEP_SECONDS);
  return hotp(secret, counter);
};

export const verifyTotpCode = (
  secret: string,
  token: string,
  window = 1,
  timestamp = Date.now(),
): boolean => {
  const normalizedToken = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedToken)) {
    return false;
  }

  const currentCounter = Math.floor(timestamp / 1000 / STEP_SECONDS);
  for (let offset = -window; offset <= window; offset += 1) {
    if (hotp(secret, currentCounter + offset) === normalizedToken) {
      return true;
    }
  }
  return false;
};

export const buildOtpAuthUrl = ({
  issuer,
  accountName,
  secret,
}: {
  issuer: string;
  accountName: string;
  secret: string;
}): string => {
  const label = `${issuer}:${accountName}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${STEP_SECONDS}`;
};

export const generateBackupCodes = (count = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
};

export const hashBackupCode = (code: string): string =>
  crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
