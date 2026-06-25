/**
 * HardwareProvider interface — pluggable hardware seed layer.
 * SoftwareHSM is the current implementation.
 * Future: TPM, AWS KMS, Azure Key Vault, TEE.
 */
export interface HardwareProvider {
  /** Returns a session-stable hardware-bound seed buffer (Shard A).
   *  Same sessionId → same seed within a master-seed rotation period.
   *  Different sessionId → different seed.
   */
  getSeed(sessionId: string): Promise<Buffer>;
  /** Wipes internal seed material. */
  destroy(): Promise<void>;
  /** Returns true if the provider is operational. */
  healthCheck(): Promise<boolean>;
}
