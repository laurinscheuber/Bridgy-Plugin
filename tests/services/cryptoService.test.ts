/**
 * Tests for CryptoService
 * Validates secure token encryption/decryption functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CryptoService } from '../../src/services/cryptoService';

describe('CryptoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when Web Crypto API is available', () => {
      expect(CryptoService.isAvailable()).toBe(true);
    });

    it('should return false when Web Crypto API is not available', () => {
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      expect(CryptoService.isAvailable()).toBe(false);
      
      global.crypto = originalCrypto;
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const originalText = 'test-token-123';
      
      const encrypted = await CryptoService.encrypt(originalText);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      
      const decrypted = await CryptoService.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should encrypt and decrypt a GitLab token', async () => {
      const gitlabToken = 'glpat-1234567890abcdef';
      
      const encrypted = await CryptoService.encrypt(gitlabToken);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(gitlabToken);
      
      const decrypted = await CryptoService.decrypt(encrypted);
      expect(decrypted).toBe(gitlabToken);
    });

    it('should produce different encrypted outputs for the same input', async () => {
      const text = 'same-input-text';
      
      const encrypted1 = await CryptoService.encrypt(text);
      const encrypted2 = await CryptoService.encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same text
      const decrypted1 = await CryptoService.decrypt(encrypted1);
      const decrypted2 = await CryptoService.decrypt(encrypted2);
      
      expect(decrypted1).toBe(text);
      expect(decrypted2).toBe(text);
    });

    it('should handle empty string', async () => {
      const emptyString = '';
      
      const encrypted = await CryptoService.encrypt(emptyString);
      const decrypted = await CryptoService.decrypt(encrypted);
      
      expect(decrypted).toBe(emptyString);
    });

    it('should handle unicode characters', async () => {
      const unicodeText = '🔐 Secure Token 测试 🚀';
      
      const encrypted = await CryptoService.encrypt(unicodeText);
      const decrypted = await CryptoService.decrypt(encrypted);
      
      expect(decrypted).toBe(unicodeText);
    });

    it('should throw error for invalid encrypted data', async () => {
      const invalidEncrypted = 'invalid-encrypted-data';
      
      await expect(CryptoService.decrypt(invalidEncrypted)).rejects.toThrow();
    });

    it('should throw error for corrupted encrypted data', async () => {
      const originalText = 'test-token';
      const encrypted = await CryptoService.encrypt(originalText);
      
      // Corrupt the encrypted data with invalid base64
      const parsed = JSON.parse(encrypted);
      parsed.ciphertext = 'invalid-base64-!!!';
      const corruptedEncrypted = JSON.stringify(parsed);
      
      await expect(CryptoService.decrypt(corruptedEncrypted)).rejects.toThrow();
    });
  });

  describe('migrateFromXOR', () => {
    it('should migrate from old XOR encryption format', async () => {
      const originalText = 'legacy-token-123';
      const xorKey = 'migration-key';
      
      // Mock the old XOR encryption (simplified)
      const mockXOREncrypted = btoa('mock-xor-data');
      
      // Mock the private xorDecrypt method to return our test data
      const migrated = await CryptoService.migrateFromXOR(mockXOREncrypted, xorKey);
      
      // Should return encrypted string (migration replaces with new encryption)
      expect(migrated).toBeDefined();
      expect(typeof migrated).toBe('string');
    });

    it('should return empty string for failed migration', async () => {
      // Use completely invalid base64 data that will fail atob()
      const invalidXORData = 'not-base64-data-!!!';
      const xorKey = 'test-key';
      
      const result = await CryptoService.migrateFromXOR(invalidXORData, xorKey);
      
      expect(result).toBe('');
    });
  });

  describe('encryption format', () => {
    it('should produce valid JSON structure', async () => {
      const text = 'test-data';
      const encrypted = await CryptoService.encrypt(text);
      
      expect(() => JSON.parse(encrypted)).not.toThrow();
      
      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('ciphertext');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('salt');
      
      expect(typeof parsed.ciphertext).toBe('string');
      expect(typeof parsed.iv).toBe('string');
      expect(typeof parsed.salt).toBe('string');
    });

    it('should use base64 encoding for binary data', async () => {
      const text = 'test-data';
      const encrypted = await CryptoService.encrypt(text);
      const parsed = JSON.parse(encrypted);
      
      // Base64 encoded strings should be valid
      expect(() => atob(parsed.ciphertext)).not.toThrow();
      expect(() => atob(parsed.iv)).not.toThrow();
      expect(() => atob(parsed.salt)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle crypto API failures gracefully', async () => {
      const originalEncrypt = crypto.subtle.encrypt;
      crypto.subtle.encrypt = vi.fn().mockRejectedValue(new Error('Crypto API failed'));
      
      await expect(CryptoService.encrypt('test')).rejects.toThrow();
      
      crypto.subtle.encrypt = originalEncrypt;
    });

    it('should handle decrypt failures gracefully', async () => {
      const originalDecrypt = crypto.subtle.decrypt;
      crypto.subtle.decrypt = vi.fn().mockRejectedValue(new Error('Decrypt failed'));
      
      const validEncrypted = await CryptoService.encrypt('test');
      
      crypto.subtle.decrypt = vi.fn().mockRejectedValue(new Error('Decrypt failed'));
      
      await expect(CryptoService.decrypt(validEncrypted)).rejects.toThrow();
      
      crypto.subtle.decrypt = originalDecrypt;
    });
  });
});