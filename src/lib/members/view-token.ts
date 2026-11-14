import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const MIN_SECRET_LENGTH = 32;
const MAX_TOKEN_LENGTH = 256;
const SIGNATURE_BYTES = 32;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

export class MemberViewSecretError extends Error {
  constructor(
    message = 'MEMBER_VIEW_SECRET is missing or shorter than 32 characters',
  ) {
    super(message);
    this.name = 'MemberViewSecretError';
  }
}

function getSecretKey(): Buffer {
  const secret = process.env.MEMBER_VIEW_SECRET;
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
    throw new MemberViewSecretError();
  }
  return Buffer.from(secret, 'utf8');
}

export function hasMemberViewSecret(): boolean {
  const secret = process.env.MEMBER_VIEW_SECRET;
  return typeof secret === 'string' && secret.length >= MIN_SECRET_LENGTH;
}

export function createMemberViewToken(memberId: string): string {
  const key = getSecretKey();
  if (!UUID_REGEX.test(memberId)) {
    throw new Error('Invalid member UUID');
  }

  const payload = Buffer.from(memberId, 'utf8').toString('base64url');
  const signingInput = `${TOKEN_VERSION}.${payload}`;
  const signature = createHmac('sha256', key)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

export function verifyMemberViewToken(token: string): string | null {
  const key = getSecretKey();

  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [version, payload, signature] = parts;
  if (
    version !== TOKEN_VERSION ||
    !payload ||
    !signature ||
    !BASE64URL_REGEX.test(payload) ||
    !BASE64URL_REGEX.test(signature)
  ) {
    return null;
  }

  const providedSignature = Buffer.from(signature, 'base64url');
  if (
    providedSignature.length !== SIGNATURE_BYTES ||
    providedSignature.toString('base64url') !== signature
  ) {
    return null;
  }

  const expectedSignature = createHmac('sha256', key)
    .update(`${version}.${payload}`)
    .digest();

  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  const payloadBuffer = Buffer.from(payload, 'base64url');
  if (payloadBuffer.toString('base64url') !== payload) {
    return null;
  }

  const memberId = payloadBuffer.toString('utf8');
  if (!UUID_REGEX.test(memberId)) {
    return null;
  }

  return memberId;
}
