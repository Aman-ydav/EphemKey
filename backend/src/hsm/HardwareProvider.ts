/**
 * HardwareProvider interface — pluggable hardware seed layer.
 * SoftwareHSM is the current implementation.
 * Future: TPM, AWS KMS, Azure Key Vault, TEE.
 */
export interface HardwareProvider {
  /** Returns a fresh hardware-bound seed buffer (Shard A). */
  getSeed(): Promise<Buffer>;
  /** Wipes internal seed material. */
  destroy(): Promise<void>;
  /** Returns true if the provider is operational. */
  healthCheck(): Promise<boolean>;
}
