import { Types } from 'mongoose';
import { SecureRecord, ISecureRecord } from '../models/SecureRecord';
import { EncryptResult } from '../../crypto/encrypt';

export interface SavePayload extends EncryptResult {
  metadata?: Record<string, unknown>;
}

export class SecureRecordRepository {
  async save(payload: SavePayload): Promise<string> {
    const doc = new SecureRecord({
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      authTag: payload.authTag,
      metadata: payload.metadata ?? {}
    });
    await doc.save();
    return doc._id.toString();
  }

  async findById(id: string): Promise<ISecureRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return SecureRecord.findById(id).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await SecureRecord.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async count(): Promise<number> {
    return SecureRecord.countDocuments().exec();
  }
}

export const secureRecordRepository = new SecureRecordRepository();
