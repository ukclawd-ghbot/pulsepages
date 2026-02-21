'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  function generateSlug(title: string) {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 8)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const slug = generateSlug(title);
    const amountInCents = Math.round(parseFloat(totalAmount || '0') * 100);

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        client_name: clientName,
        client_email: clientEmail || null,
        description: description || null,
        total_amount: amountInCents,
        proposal_content: proposalContent || null,
        slug,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Create activity
    await supabase.from('activities').insert({
      project_id: data.id,
      actor: 'owner',
      action: 'created',
      description: 'Project created',
    });

    router.push(`/projects/${data.id}`);
  }

  const inputClass =
    'w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

  return (
    <div className="max-w-2xl">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <h1 className="text-xl font-semibold text-white mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Project Details</h2>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="Website Redesign"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className={inputClass}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className={inputClass}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Brief project description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Total Amount ($)
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="5000.00"
            />
          </div>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Proposal Content</h2>
          <p className="text-xs text-neutral-500">
            Write the proposal your client will see on the project page.
          </p>
          <textarea
            value={proposalContent}
            onChange={(e) => setProposalContent(e.target.value)}
            rows={10}
            className={inputClass}
            placeholder="## Project Overview&#10;&#10;Describe the scope of work, deliverables, timeline, and terms..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/projects"
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}
