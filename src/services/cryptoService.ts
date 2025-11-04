/**
 * Secure encryption service using Web Crypto API
 * Replaces the insecure XOR-based encryption in securityUtils
 */

import { ErrorHandler } from '../utils/errorHandler';

interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export class CryptoService {
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 256;
  private static readonly TAG_LENGTH = 128;
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;

  /**
   * Derives an encryption key from a password and salt
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    try {
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: this.ITERATIONS,
          hash: 'SHA-256'
        },
        passwordKey,
        {
          name: 'AES-GCM',
          length: this.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        operation: 'derive_key',
        component: 'CryptoService',
        severity: 'high'
      });
      throw error;
    }
  }

  /**
   * Generates a unique key for each Figma file
   */
  private static getFileKey(): string {
    // Use a combination of user ID and file ID for uniqueness
    const userId = figma.currentUser?.id || 'anonymous';
    const fileId = figma.root.id;
    return `${userId}-${fileId}`;
  }

  /**
   * Encrypts sensitive data using AES-GCM
   */
  static async encrypt(plaintext: string): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const key = await this.deriveKey(this.getFileKey(), new Uint8Array(salt));

      const encoder = new TextEncoder();
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: this.TAG_LENGTH
        },
        key,
        encoder.encode(plaintext)
      );

      const encryptedData: EncryptedData = {
        ciphertext: this.bufferToBase64(ciphertext),
        iv: this.bufferToBase64(iv),
        salt: this.bufferToBase64(salt)
      };

      return JSON.stringify(encryptedData);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        operation: 'encrypt',
        component: 'CryptoService',
        severity: 'high'
      });
      throw error;
    }
  }

  /**
   * Decrypts data encrypted with encrypt()
   */
  static async decrypt(encryptedString: string): Promise<string> {
    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedString);
      
      const salt = this.base64ToBuffer(encryptedData.salt);
      const iv = this.base64ToBuffer(encryptedData.iv);
      const ciphertext = this.base64ToBuffer(encryptedData.ciphertext);
      
      const key = await this.deriveKey(this.getFileKey(), new Uint8Array(salt));

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: this.TAG_LENGTH
        },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        operation: 'decrypt',
        component: 'CryptoService',
        severity: 'high'
      });
      throw error;
    }
  }

  /**
   * Converts ArrayBuffer to base64 string
   */
  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts base64 string to ArrayBuffer
   */
  private static base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Checks if Web Crypto API is available
   */
  static isAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           crypto.subtle !== undefined &&
           typeof crypto.getRandomValues === 'function';
  }

  /**
   * Migrates from old XOR encryption to new encryption
   * This is a one-time operation during the upgrade
   */
  static async migrateFromXOR(xorEncrypted: string, key: string): Promise<string> {
    try {
      // First decrypt using old XOR method
      const decrypted = this.xorDecrypt(xorEncrypted, key);
      
      // Then encrypt using new secure method
      return await this.encrypt(decrypted);
    } catch (error) {
      console.error('Migration failed, returning empty string');
      return '';
    }
  }

  /**
   * Legacy XOR decryption for migration purposes only
   */
  private static xorDecrypt(encrypted: string, key: string): string {
    // Implementation copied from securityUtils for migration
    const encryptedBytes = new Uint8Array(
      atob(encrypted).split('').map(c => c.charCodeAt(0))
    );
    const keyBytes = new TextEncoder().encode(key);
    const decrypted = new Uint8Array(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(decrypted);
  }
}