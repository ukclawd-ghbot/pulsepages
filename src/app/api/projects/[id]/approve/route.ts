import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();

  // Use service-level access since clients aren't authenticated
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('projects')
    .update({
      status: 'approved',
      approved_at: now,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from('activities').insert({
    project_id: id,
    actor: 'client',
    action: 'approved',
    description: 'Client approved the proposal',
  });

  return NextResponse.json({ success: true });
}
