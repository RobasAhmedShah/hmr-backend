import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Magic } from '@magic-sdk/admin';

@Injectable()
export class MagicService implements OnModuleInit {
  private readonly logger = new Logger(MagicService.name);
  private magic: Magic;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const secretKey = this.configService.get<string>('MAGIC_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('MAGIC_SECRET_KEY not found in environment variables');
      return;
    }
    this.magic = new Magic(secretKey);
    this.logger.log('Magic Admin SDK initialized');
  }

  /**
   * Create an embedded wallet for a user using email
   * Note: Magic embedded wallets are created client-side when users authenticate with Magic SDK
   * Since we're using Google OAuth, wallets will be created on the client when users first
   * interact with Magic features. This method returns null to allow the flow to continue.
   * @param email - User email to associate with the wallet
   * @returns Promise with wallet address and DID, or null if wallet doesn't exist yet
   */
  async createWallet(email: string): Promise<{ address: string; did: string } | null> {
    try {
      if (!this.magic) {
        this.logger.warn('Magic SDK not initialized. Check MAGIC_SECRET_KEY.');
        return null;
      }

      // Magic embedded wallets are created client-side when users authenticate with Magic
      // For Google OAuth users, the wallet will be created when they first use Magic features
      // on the client side. We return null here to allow the user creation flow to continue.
      this.logger.log(`Magic wallet will be created client-side for ${email} on first Magic interaction.`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to create/get Magic wallet for ${email}:`, error);
      // Return null to allow the flow to continue - wallet will be created on client-side
      return null;
    }
  }

  /**
   * Get wallet information for a user by email
   * Note: Magic embedded wallets are created client-side when users authenticate with Magic SDK
   * This method is a placeholder - wallets will be retrieved from the database after client-side creation
   * @param email - User email
   * @returns Promise with wallet address and DID, or null if not found
   */
  async getWalletByEmail(email: string): Promise<{ address: string; did: string } | null> {
    // Magic embedded wallets are created client-side
    // The wallet address and DID will be stored in the database after client-side creation
    // This method can be used to retrieve wallet info from Magic Admin SDK in the future
    // if needed, but for now we rely on database storage
    this.logger.log(`Wallet info for ${email} should be retrieved from database after client-side creation.`);
    return null;
  }
}

