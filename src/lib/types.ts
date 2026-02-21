export interface User {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro' | 'agency';
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  title: string;
  description: string | null;
  status: 'draft' | 'sent' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  slug: string;
  total_amount: number;
  currency: string;
  proposal_content: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  stripe_payment_intent_id: string | null;
  stripe_payment_link: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  project_id: string;
  actor: 'owner' | 'client' | 'system';
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
