import { getSku } from './skus.js';

function reqStr(src, field) {
  if (!src[field] || typeof src[field] !== 'string' || !src[field].trim()) {
    return { error: `Missing required field: ${field}` };
  }
  return { value: src[field].trim() };
}

function longText(src, field, { min = 20, max = 8000 } = {}) {
  const raw = typeof src[field] === 'string' ? src[field] : '';
  if (raw.trim().length < min) {
    return { error: `${field} is required and must be at least ${min} characters` };
  }
  if (raw.length > max) {
    return { error: `${field} must be at most ${max} characters` };
  }
  return { value: raw };
}

export function validateInput(sku, body) {
  const product = getSku(sku);
  const src = body && typeof body === 'object' ? body : {};
  if (!product) return { ok: false, error: 'Unknown SKU' };

  const kind = product.sku;
  const input = {};

  if (kind === 'gym-cancel') {
    for (const field of ['fullName', 'memberId', 'clubName', 'clubAddress', 'cancelBy']) {
      const got = reqStr(src, field);
      if (got.error) return { ok: false, error: got.error };
      input[field] = got.value;
    }
    if (src.cardLast4 != null && String(src.cardLast4).trim()) {
      const last4 = String(src.cardLast4).trim();
      if (!/^\d{4}$/.test(last4)) {
        return { ok: false, error: 'cardLast4 must be exactly 4 digits' };
      }
      input.cardLast4 = last4;
    }
    return { ok: true, input };
  }

  if (kind === 'diplomat') {
    const got = longText(src, 'message');
    if (got.error) return { ok: false, error: got.error };
    return { ok: true, input: { message: got.value } };
  }

  for (const field of product.fields || []) {
    if (field.optional) {
      if (src[field.name] && typeof src[field.name] === 'string' && src[field.name].trim()) {
        input[field.name] = src[field.name].trim();
      }
      continue;
    }
    const got = field.type === 'textarea' ? longText(src, field.name) : reqStr(src, field.name);
    if (got.error) return { ok: false, error: got.error };
    input[field.name] = got.value;
  }
  return { ok: true, input };
}
