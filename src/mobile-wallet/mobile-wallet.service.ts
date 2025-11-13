import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { TransactionsService } from '../transactions/transactions.service';
import { InvestmentsService } from '../investments/investments.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { MobileDepositDto } from './dto/mobile-deposit.dto';
import Decimal from 'decimal.js';

@Injectable()
export class MobileWalletService {
  constructor(
    private readonly walletService: WalletService,
    private readonly portfolioService: PortfolioService,
    private readonly transactionsService: TransactionsService,
    private readonly investmentsService: InvestmentsService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  async getWallet(userId: string): Promise<any> {
    // Get wallet
    const wallet = await this.walletService.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Get portfolio for total invested and earnings
    // Handle case where portfolio might not exist (edge case for old users)
    let portfolioData: any;
    try {
      portfolioData = await this.portfolioService.getDetailedPortfolio(userId);
    } catch (error) {
      // If portfolio doesn't exist, use default values
      portfolioData = {
        summary: {
          totalInvestedUSDT: '0',
          totalRewardsUSDT: '0',
          totalCurrentValueUSDT: '0',
        },
      };
    }

    // Calculate total current value (wallet balance + portfolio current value)
    const walletBalance = wallet.balanceUSDT as Decimal;
    const portfolioCurrentValue = new Decimal(portfolioData.summary?.totalCurrentValueUSDT || '0');
    const totalValue = walletBalance.plus(portfolioCurrentValue);

    // Calculate totalEarnings: sum of (currentValue - investedAmount) for all investments
    // Mobile app expects: totalEarnings = sum of (currentValue - investedAmount)
    // This is different from totalRewardsUSDT (which is actual reward transactions)
    let totalEarnings = new Decimal(0);
    try {
      const investments = await this.investmentsService.findByUserId(userId);
      totalEarnings = investments.reduce((sum, inv) => {
        // Calculate currentValue with 15% growth (matching mobile app calculation)
        const baseValue = inv.tokensPurchased.mul(
          inv.property?.pricePerTokenUSDT || new Decimal(0),
        );
        const currentValue = baseValue.mul(1.15); // 15% growth multiplier
        const earnings = currentValue.minus(inv.amountUSDT);
        return sum.plus(earnings);
      }, new Decimal(0));
    } catch (error) {
      // If error, use 0
      totalEarnings = new Decimal(0);
    }

    // Calculate pending deposits (transactions with status 'pending' and type 'deposit')
    // Handle case where transactions service might throw error
    let allTransactions: any[] = [];
    try {
      allTransactions = await this.transactionsService.findUserTransactions(userId);
    } catch (error) {
      // If error, use empty array (no transactions)
      allTransactions = [];
    }

    const pendingDeposits = allTransactions
      .filter((txn) => txn.type === 'deposit' && txn.status === 'pending')
      .reduce((sum, txn) => sum.plus(txn.amountUSDT as Decimal), new Decimal(0));

    return {
      usdc: walletBalance.toNumber(),
      totalValue: totalValue.toNumber(),
      totalInvested: new Decimal(portfolioData.summary?.totalInvestedUSDT || '0').toNumber(),
      totalEarnings: totalEarnings.toNumber(), // Calculated from investments (currentValue - investedAmount)
      pendingDeposits: pendingDeposits.toNumber(),
    };
  }

  async deposit(userId: string, dto: MobileDepositDto): Promise<any> {
    // If payment method ID is not provided, find the default payment method
    let paymentMethodId = dto.paymentMethodId;

    if (!paymentMethodId) {
      // Find user's default payment method
      const paymentMethods = await this.paymentMethodsService.findByUserId(userId);
      const defaultMethod = paymentMethods.find(
        (method) => method.isDefault && method.status === 'verified',
      );

      if (!defaultMethod) {
        throw new BadRequestException(
          'No payment method provided and no default payment method found. Please add a payment method first.',
        );
      }

      paymentMethodId = defaultMethod.id;
    }

    // Verify the payment method belongs to the user and is verified
    const paymentMethod = await this.paymentMethodsService.findOne(paymentMethodId);

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId !== userId) {
      throw new BadRequestException('Payment method does not belong to you');
    }

    if (paymentMethod.status !== 'verified') {
      throw new BadRequestException('Payment method is not verified');
    }

    // Process deposit using payment methods service (which handles the wallet service internally)
    const result = await this.paymentMethodsService.initiateDeposit({
      userId: userId,
      amountUSDT: dto.amountUSDT,
      methodId: paymentMethodId,
    });

    // Fetch and return updated wallet balance
    const updatedWallet = await this.getWallet(userId);

    return {
      success: true,
      transaction: result.transaction,
      wallet: updatedWallet,
    };
  }
}

