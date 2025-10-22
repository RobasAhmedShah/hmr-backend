/**
 * Event emitted when KYC verification is completed
 */
export interface KycVerifiedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  kycId: string;
  status: 'verified' | 'rejected';
  verificationDate: Date;
}
