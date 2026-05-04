// Admin Dashboard Types

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  subscriptionStatus: 'authorized' | 'paused' | 'cancelled' | 'pending' | null;
  currentCredits: number;
}

export interface AdminUserDetail extends AdminUser {
  subscription: {
    id: string;
    mpSubscriptionId: string;
    status: 'authorized' | 'paused' | 'cancelled' | 'pending';
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
  creditsHistory: CreditTransaction[];
  payments: PaymentRecord[];
}

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: 'monthly_grant' | 'ai_usage' | 'bonus';
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export type SubscriptionAction = 'activate' | 'pause' | 'cancel';

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}