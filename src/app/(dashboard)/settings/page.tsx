'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Check, CreditCard, User as UserIcon } from 'lucide-react';
import type { User } from '@/lib/types';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0/mo',
    features: ['1 active project', 'Basic features'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19/mo',
    features: ['Unlimited projects', 'Custom branding', 'Payments'],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$49/mo',
    features: ['Everything in Pro', 'Team members', 'Client CRM', 'Analytics'],
  },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        const p = data as User;
        setProfile(p);
        setFullName(p.full_name || '');
        setBusinessName(p.business_name || '');
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    await supabase
      .from('users')
      .update({ full_name: fullName, business_name: businessName })
      .eq('id', profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Upgrade functionality coming soon

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {/* Profile */}
      <form
        onSubmit={handleSave}
        className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <UserIcon className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-white">Profile</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={profile?.email ?? ''}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Subscription */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-white">Subscription</h2>
        </div>

        <p className="text-sm text-neutral-400 mb-4">
          Current plan:{' '}
          <span className="text-white font-medium capitalize">
            {profile?.plan ?? 'free'}
          </span>
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = profile?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`border rounded-xl p-4 ${
                  isCurrent
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-[#262626]'
                }`}
              >
                <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                <p className="text-lg font-bold text-white mt-1">{plan.price}</p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-xs text-neutral-400 flex items-start gap-1.5"
                    >
                      <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <p className="text-xs text-emerald-500 font-medium mt-4">
                    Current Plan
                  </p>
                ) : plan.id !== 'free' ? (
                  <p className="text-xs text-neutral-500 mt-4">Coming soon</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
