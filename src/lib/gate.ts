export type Plan = 'trial' | 'free' | 'pro';

export interface Subscription {
  plan: Plan;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export const PRO_FEATURES = ['money', 'content', 'projects', 'notes', 'reminders'] as const;

export type ProFeature = (typeof PRO_FEATURES)[number];

const FEATURE_LABELS: Record<string, string> = {
  money: 'Money & Investments',
  content: 'Content Pipeline',
  projects: 'Projects',
  notes: 'Notes',
  reminders: 'Reminders',
};

export function featureLabel(feature: string): string {
  return FEATURE_LABELS[feature] || feature;
}

export function isFeatureLocked(feature: string, subscription: Subscription | null): boolean {
  if (!subscription) return true;
  if (subscription.plan === 'pro') return false;
  if (subscription.plan === 'trial') return false;
  return (PRO_FEATURES as readonly string[]).includes(feature);
}

export function isTrialExpired(subscription: Subscription | null): boolean {
  if (!subscription || subscription.plan !== 'trial') return false;
  if (!subscription.trialEndsAt) return false;
  return new Date(subscription.trialEndsAt) < new Date();
}

// True when the user has Pro access, including an unexpired trial.
export function isProPlan(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.plan === 'pro') return true;
  if (subscription.plan === 'trial') return !isTrialExpired(subscription);
  return false;
}

export function getSubscriptionLabel(subscription: Subscription | null): string {
  if (!subscription) return 'Free';
  if (subscription.plan === 'trial') {
    if (isTrialExpired(subscription)) return 'Free';
    const days = Math.ceil(
      (new Date(subscription.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return `Trial · ${days}d left`;
  }
  if (subscription.plan === 'pro') return 'Pro';
  return 'Free';
}
