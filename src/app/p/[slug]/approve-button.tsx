'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function ApproveButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/approve`, {
      method: 'POST',
    });

    if (res.ok) {
      setApproved(true);
    }
    setLoading(false);
  }

  if (approved) {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Approved!</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-5 w-5" />
      )}
      Approve Proposal
    </button>
  );
}
