import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export interface Plan {
  id: string;
  name: string;
  price_brl: number;
  stripe_price_id: string;
  max_students: number | null;
  features: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: Plan | null;
  isLoading: boolean;
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
  maxStudents: number | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setPlan(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSubscription(sub ?? null);

      if (sub?.plan_id) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', sub.plan_id)
          .single();
        setPlan(planData ?? null);
      } else {
        setPlan(null);
      }
    } catch {
      setSubscription(null);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isActive =
    subscription?.status === 'active' || subscription?.status === 'trialing';

  const isTrial = subscription?.status === 'trialing';

  const trialEndsAt = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;

  const maxStudents = plan?.max_students ?? null;

  return {
    subscription,
    plan,
    isLoading,
    isActive,
    isTrial,
    trialEndsAt,
    maxStudents,
    refetch: fetchSubscription,
  };
}
