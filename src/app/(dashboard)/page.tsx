import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  FolderKanban,
  CircleDot,
  DollarSign,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { Project } from '@/lib/types';

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-500/20 text-neutral-400',
  sent: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const allProjects = (projects ?? []) as Project[];
  const activeProjects = allProjects.filter(
    (p) => p.status === 'approved' || p.status === 'in_progress' || p.status === 'sent'
  );
  const totalRevenue = allProjects
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.total_amount, 0);

  const stats = [
    {
      label: 'Total Projects',
      value: allProjects.length,
      icon: FolderKanban,
    },
    {
      label: 'Active',
      value: activeProjects.length,
      icon: CircleDot,
    },
    {
      label: 'Revenue',
      value: `$${(totalRevenue / 100).toLocaleString()}`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141414] border border-[#262626] rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <stat.icon className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-sm text-neutral-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl">
        <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Projects</h2>
          <Link
            href="/projects"
            className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {allProjects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderKanban className="h-8 w-8 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-400 mb-4">No projects yet</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {allProjects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {project.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {project.client_name}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-neutral-400">
                    ${(project.total_amount / 100).toLocaleString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      statusColors[project.status] ?? statusColors.draft
                    }`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
