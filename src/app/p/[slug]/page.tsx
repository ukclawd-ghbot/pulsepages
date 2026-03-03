import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Zap,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Activity as ActivityIcon,
} from 'lucide-react';
import type { Project, Milestone, Invoice, Activity } from '@/lib/types';
import ApproveButton from './approve-button';

async function createPublicClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
}

const milestoneIcons: Record<string, typeof Circle> = {
  pending: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
};

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-neutral-500/20 text-neutral-400',
  sent: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
  overdue: 'bg-red-500/20 text-red-400',
};

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createPublicClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!project) notFound();

  const typedProject = project as Project;

  // Fetch owner info for branding
  const { data: owner } = await supabase
    .from('users')
    .select('full_name, business_name')
    .eq('id', typedProject.user_id)
    .single();

  const [milestonesRes, invoicesRes, activitiesRes] = await Promise.all([
    supabase
      .from('milestones')
      .select('*')
      .eq('project_id', typedProject.id)
      .order('sort_order'),
    supabase
      .from('invoices')
      .select('*')
      .eq('project_id', typedProject.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activities')
      .select('*')
      .eq('project_id', typedProject.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const milestones = (milestonesRes.data ?? []) as Milestone[];
  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const activities = (activitiesRes.data ?? []) as Activity[];

  const completedMilestones = milestones.filter(
    (m) => m.status === 'completed'
  ).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0;

  const businessName = owner?.business_name || owner?.full_name || 'PulsePages';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#262626]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <Zap className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm font-semibold text-white">{businessName}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Project Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {typedProject.title}
          </h1>
          {typedProject.description && (
            <p className="text-neutral-400">{typedProject.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
            <span className="capitalize">
              Status:{' '}
              <span
                className={`${
                  typedProject.status === 'approved' || typedProject.status === 'completed'
                    ? 'text-emerald-400'
                    : typedProject.status === 'in_progress'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                }`}
              >
                {typedProject.status.replace('_', ' ')}
              </span>
            </span>
            <span>
              Total: ${(typedProject.total_amount / 100).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Approval */}
        {(typedProject.status === 'sent' || typedProject.status === 'draft') && (
          <div className="bg-[#141414] border border-emerald-500/30 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              Approve this proposal
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              Review the details below and click approve to get started.
            </p>
            <ApproveButton projectId={typedProject.id} />
          </div>
        )}

        {typedProject.approved_at && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Proposal Approved
              </p>
              <p className="text-xs text-neutral-500">
                {new Date(typedProject.approved_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Proposal Content */}
        {typedProject.proposal_content && (
          <section className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-white">Proposal</h2>
            </div>
            <div className="prose prose-sm prose-invert max-w-none text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {typedProject.proposal_content}
            </div>
          </section>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <section className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-white">
                Project Milestones
              </h2>
              <span className="text-xs text-neutral-500 ml-auto">
                {completedMilestones}/{milestones.length} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-3">
              {milestones.map((milestone) => {
                const Icon = milestoneIcons[milestone.status] ?? Circle;
                return (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        milestone.status === 'completed'
                          ? 'text-emerald-500'
                          : milestone.status === 'in_progress'
                            ? 'text-amber-500'
                            : 'text-neutral-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          milestone.status === 'completed'
                            ? 'text-neutral-500 line-through'
                            : 'text-white'
                        }`}
                      >
                        {milestone.title}
                      </p>
                    </div>
                    {milestone.due_date && (
                      <span className="text-xs text-neutral-600 shrink-0">
                        {new Date(milestone.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Invoices */}
        {invoices.length > 0 && (
          <section className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-white">Invoices</h2>
            </div>

            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center gap-4 py-3 border-b border-[#1e1e1e] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      ${(invoice.amount / 100).toLocaleString()}
                    </p>
                    {invoice.due_date && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Due {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      invoiceStatusColors[invoice.status] ?? ''
                    }`}
                  >
                    {invoice.status}
                  </span>
                  {invoice.payment_link && invoice.status !== 'paid' && (
                    <a
                      href={invoice.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Pay Now
                    </a>
                  )}
                  {invoice.status === 'paid' && (
                    <span className="text-xs text-emerald-500">Paid</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Timeline */}
        {activities.length > 0 && (
          <section className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ActivityIcon className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-white">Activity</h2>
            </div>

            <div className="relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[#262626]" />
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div
                      className={`h-[11px] w-[11px] rounded-full mt-1 shrink-0 z-10 ring-4 ring-[#141414] ${
                        activity.actor === 'client'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300">
                        {activity.description}
                      </p>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-[#1e1e1e]">
          <div className="flex items-center justify-center gap-1.5 text-neutral-600 text-xs">
            <Zap className="h-3 w-3" />
            Powered by PulsePages
          </div>
        </footer>
      </main>
    </div>
  );
}
