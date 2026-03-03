'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Send,
  ExternalLink,
  Loader2,
  ClipboardCopy,
  DollarSign,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
} from 'lucide-react';
import type { Project, Milestone, Invoice, Activity } from '@/lib/types';

const tabs = ['Overview', 'Milestones', 'Invoices', 'Activity'] as const;
type Tab = (typeof tabs)[number];

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-500/20 text-neutral-400',
  sent: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
  pending: 'bg-neutral-500/20 text-neutral-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
  overdue: 'bg-red-500/20 text-red-400',
};

const milestoneIcons = {
  pending: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Milestone form
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDue, setNewMilestoneDue] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  // Invoice form
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceDue, setNewInvoiceDue] = useState('');
  const [addingInvoice, setAddingInvoice] = useState(false);

  const fetchData = useCallback(async () => {
    const [projectRes, milestonesRes, invoicesRes, activitiesRes] =
      await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase
          .from('milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order'),
        supabase
          .from('invoices')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('activities')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
      ]);

    if (projectRes.data) setProject(projectRes.data as Project);
    setMilestones((milestonesRes.data ?? []) as Milestone[]);
    setInvoices((invoicesRes.data ?? []) as Invoice[]);
    setActivities((activitiesRes.data ?? []) as Activity[]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    setAddingMilestone(true);

    await supabase.from('milestones').insert({
      project_id: projectId,
      title: newMilestoneTitle,
      due_date: newMilestoneDue || null,
      sort_order: milestones.length,
    });

    setNewMilestoneTitle('');
    setNewMilestoneDue('');
    setAddingMilestone(false);
    fetchData();
  }

  async function updateMilestoneStatus(
    id: string,
    status: Milestone['status']
  ) {
    await supabase
      .from('milestones')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (status === 'completed') {
      await supabase.from('activities').insert({
        project_id: projectId,
        actor: 'owner',
        action: 'milestone_completed',
        description: `Milestone completed`,
      });
    }

    fetchData();
  }

  async function deleteMilestone(id: string) {
    await supabase.from('milestones').delete().eq('id', id);
    fetchData();
  }

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!newInvoiceAmount) return;
    setAddingInvoice(true);

    const amountInCents = Math.round(parseFloat(newInvoiceAmount) * 100);

    await supabase.from('invoices').insert({
      project_id: projectId,
      amount: amountInCents,
      due_date: newInvoiceDue || null,
      status: 'draft',
    });

    await supabase.from('activities').insert({
      project_id: projectId,
      actor: 'owner',
      action: 'invoice_created',
      description: `Invoice created for $${parseFloat(newInvoiceAmount).toFixed(2)}`,
    });

    setNewInvoiceAmount('');
    setNewInvoiceDue('');
    setAddingInvoice(false);
    fetchData();
  }

  // Payment link creation - coming soon

  async function sendToClient() {
    if (!project) return;

    await supabase
      .from('projects')
      .update({ status: 'sent' })
      .eq('id', project.id);

    await supabase.from('activities').insert({
      project_id: project.id,
      actor: 'owner',
      action: 'sent',
      description: 'Project sent to client',
    });

    fetchData();
  }

  async function updateProjectStatus(status: Project['status']) {
    if (!project) return;
    await supabase
      .from('projects')
      .update({ status })
      .eq('id', project.id);
    fetchData();
  }

  function copyLink() {
    if (!project) return;
    const url = `${window.location.origin}/p/${project.slug}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-400">Project not found</p>
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

  const completedMilestones = milestones.filter(
    (m) => m.status === 'completed'
  ).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-white truncate">
              {project.title}
            </h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${
                statusColors[project.status] ?? ''
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {project.client_name}
            {project.client_email && ` · ${project.client_email}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-3 py-2 border border-[#262626] hover:bg-[#141414] text-neutral-300 text-sm rounded-lg transition-colors"
          >
            <ClipboardCopy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          {project.status === 'draft' && (
            <button
              onClick={sendToClient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
              Send to Client
            </button>
          )}

          {(project.status === 'approved' || project.status === 'sent') && (
            <button
              onClick={() => updateProjectStatus('in_progress')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start Project
            </button>
          )}

          {project.status === 'in_progress' && (
            <button
              onClick={() => updateProjectStatus('completed')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              Mark Complete
            </button>
          )}

          <a
            href={`/p/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 border border-[#262626] hover:bg-[#141414] text-neutral-300 text-sm rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#262626] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Total Amount</p>
              <p className="text-lg font-bold text-white">
                ${(project.total_amount / 100).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Milestones</p>
              <p className="text-lg font-bold text-white">
                {completedMilestones}/{milestones.length}
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Invoiced</p>
              <p className="text-lg font-bold text-white">
                $
                {(
                  invoices.reduce((s, i) => s + i.amount, 0) / 100
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {milestones.length > 0 && (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white">Progress</p>
                <p className="text-sm text-neutral-400">{progressPercent}%</p>
              </div>
              <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Proposal */}
          {project.proposal_content && (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Proposal</h3>
              <div className="prose prose-sm prose-invert max-w-none text-neutral-300 whitespace-pre-wrap">
                {project.proposal_content}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'Milestones' && (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const Icon = milestoneIcons[milestone.status];
            return (
              <div
                key={milestone.id}
                className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-center gap-4"
              >
                <button
                  onClick={() =>
                    updateMilestoneStatus(
                      milestone.id,
                      milestone.status === 'completed'
                        ? 'pending'
                        : milestone.status === 'pending'
                          ? 'in_progress'
                          : 'completed'
                    )
                  }
                  className="shrink-0"
                >
                  <Icon
                    className={`h-5 w-5 ${
                      milestone.status === 'completed'
                        ? 'text-emerald-500'
                        : milestone.status === 'in_progress'
                          ? 'text-amber-500'
                          : 'text-neutral-500'
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      milestone.status === 'completed'
                        ? 'text-neutral-500 line-through'
                        : 'text-white'
                    }`}
                  >
                    {milestone.title}
                  </p>
                  {milestone.due_date && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Due {new Date(milestone.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    statusColors[milestone.status] ?? ''
                  }`}
                >
                  {milestone.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => deleteMilestone(milestone.id)}
                  className="text-neutral-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* Add milestone form */}
          <form
            onSubmit={addMilestone}
            className="bg-[#141414] border border-[#262626] border-dashed rounded-xl p-4 flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="New milestone..."
              required
              className={`${inputClass} flex-1`}
            />
            <input
              type="date"
              value={newMilestoneDue}
              onChange={(e) => setNewMilestoneDue(e.target.value)}
              className={`${inputClass} sm:w-40`}
            />
            <button
              type="submit"
              disabled={addingMilestone}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              {addingMilestone ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </button>
          </form>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'Invoices' && (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-center gap-4"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  ${(invoice.amount / 100).toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {invoice.due_date && (
                    <p className="text-xs text-neutral-500">
                      Due {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  statusColors[invoice.status] ?? ''
                }`}
              >
                {invoice.status}
              </span>
              {invoice.payment_link && (
                <a
                  href={invoice.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Pay Link
                </a>
              )}
            </div>
          ))}

          {/* Add invoice form */}
          <form
            onSubmit={addInvoice}
            className="bg-[#141414] border border-[#262626] border-dashed rounded-xl p-4 flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                $
              </span>
              <input
                type="number"
                value={newInvoiceAmount}
                onChange={(e) => setNewInvoiceAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className={`${inputClass} pl-7`}
              />
            </div>
            <input
              type="date"
              value={newInvoiceDue}
              onChange={(e) => setNewInvoiceDue(e.target.value)}
              className={`${inputClass} sm:w-40`}
            />
            <button
              type="submit"
              disabled={addingInvoice}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              {addingInvoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Invoice
            </button>
          </form>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'Activity' && (
        <div className="space-y-0">
          {activities.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">
              No activity yet
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-[#262626]" />
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div
                      className={`h-[9px] w-[9px] rounded-full mt-1.5 shrink-0 z-10 ring-4 ring-[#0a0a0a] ${
                        activity.actor === 'client'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {new Date(activity.created_at).toLocaleString()} ·{' '}
                        <span className="capitalize">{activity.actor}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
