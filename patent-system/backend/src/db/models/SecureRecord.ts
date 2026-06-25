import { Schema, model, Document } from 'mongoose';

/**
 * SecureRecord — the ONLY document stored in MongoDB.
 * Fields deliberately contain NO key material, no plaintext, no secrets.
 */
export interface ISecureRecord extends Document {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const SecureRecordSchema = new Schema<ISecureRecord>(
  {
    ciphertext: { type: Buffer, required: true },
    iv: { type: Buffer, required: true },
    authTag: { type: Buffer, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SecureRecord = model<ISecureRecord>('SecureRecord', SecureRecordSchema);
