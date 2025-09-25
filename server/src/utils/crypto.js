import crypto from 'crypto';

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 chars for AES-256-CBC');
  }
  return Buffer.from(key, 'utf8');
}

export function sha256(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function aesEncrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(plainText, 'utf8')), cipher.final()]);
  return { iv: iv.toString('base64'), cipherText: enc.toString('base64') };
}

export function aesDecrypt(ivBase64, cipherBase64) {
  const key = getKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const cipherBuf = Buffer.from(cipherBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const dec = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
  return dec.toString('utf8');
}
