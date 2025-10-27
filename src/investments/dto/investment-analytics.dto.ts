import { IsOptional, IsString } from 'class-validator';

export class InvestmentAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  orgId?: string;
}

export class InvestmentAnalyticsDto {
  investments: any[];
  analytics: {
    totalInvestments: number;
    totalAmountUSDT: string;
    totalTokensPurchased: string;
    averageInvestmentAmount: string;
    averageTokensPerInvestment: string;
    totalExpectedROI: string;
    activeInvestments: number;
    completedInvestments: number;
    pendingInvestments: number;
    totalValueAtCurrentPrice?: string;
  };
}

export class UserInvestmentAnalyticsDto extends InvestmentAnalyticsDto {
  user: {
    id: string;
    displayCode: string;
    fullName: string;
    email: string;
  };
}

export class OrganizationInvestmentAnalyticsDto extends InvestmentAnalyticsDto {
  organization: {
    id: string;
    displayCode: string;
    name: string;
  };
}

export class UserOrganizationInvestmentAnalyticsDto extends InvestmentAnalyticsDto {
  user: {
    id: string;
    displayCode: string;
    fullName: string;
    email: string;
  };
  organization: {
    id: string;
    displayCode: string;
    name: string;
  };
}
