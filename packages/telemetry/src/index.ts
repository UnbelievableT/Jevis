const secretKey = /token|password|secret|authorization|api.?key/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, secretKey.test(k) ? '[REDACTED]' : redact(v)]),
    );
  return value;
}
// This helper only redacts secret-shaped keys. Raw prompts, file contents and provider payloads must not be logged by default.
