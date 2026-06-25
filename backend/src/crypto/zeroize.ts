/**
 * Overwrites buffer contents with zeros and nullifies the reference.
 * Called immediately after every cryptographic operation.
 */
export function zeroize(buf: Buffer | null | undefined): null {
  if (buf && Buffer.isBuffer(buf)) {
    buf.fill(0);
  }
  return null;
}

export function zeroizeMany(...buffers: Array<Buffer | null | undefined>): void {
  for (const buf of buffers) {
    zeroize(buf);
  }
}
