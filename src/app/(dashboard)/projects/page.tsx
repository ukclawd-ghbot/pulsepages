import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import type { Project } from '@/lib/types';

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-500/20 text-neutral-400',
  sent: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default async function ProjectsPage() {
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

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Projects</h1>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {allProjects.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-12 text-center">
          <FolderKanban className="h-10 w-10 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-base font-medium text-white mb-2">No projects yet</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Create your first project to get started with client proposals and invoicing.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-[#363636] transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate mr-2">
                  {project.title}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    statusColors[project.status] ?? statusColors.draft
                  }`}
                >
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-3">{project.client_name}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  ${(project.total_amount / 100).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-600">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
