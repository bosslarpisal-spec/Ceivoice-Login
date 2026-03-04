import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';

import GooglePasswordNotice from '@/components/GooglePasswordNotice';

/* ================= TYPES ================= */

type DashboardUser = {
  name: string;
  role: string;
  initial: string;
  provider: string;
};

/* ================= GET USER ================= */

async function getUser(): Promise<DashboardUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return {
      name: 'Guest',
      role: 'USER',
      initial: 'G',
      provider: 'guest',
    };
  }

  const decoded: any = await verifyJWT(token);

  if (!decoded?.userId) {
    return {
      name: 'Guest',
      role: 'USER',
      initial: 'G',
      provider: 'guest',
    };
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('full_name, email, role, provider')
    .eq('id', decoded.userId)
    .maybeSingle();

  if (!user) {
    return {
      name: 'Guest',
      role: 'USER',
      initial: 'G',
      provider: 'guest',
    };
  }

  const displayName =
    user.full_name?.trim() !== ''
      ? user.full_name
      : user.email;

  return {
    name: displayName,
    role: user.role || 'USER',
    initial: displayName.charAt(0).toUpperCase(),
    provider: user.provider || 'local',
  };
}

/* ================= LAYOUT ================= */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans">

      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950/50">

        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="h-6 w-6 bg-white rounded-full"></span>
            CEIVoice
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">

          <SidebarLink href="/tickets" icon="🎫" label="Tickets" />
          <SidebarLink href="/tickets/create" icon="✍️" label="New Ticket" />

          {(user.role === 'ADMIN' || user.role === 'ASSIGNEE') && (
            <>
              <div className="pt-6 pb-2 px-2 text-xs text-zinc-500 uppercase">
                Admin Console
              </div>

              <SidebarLink href="/admin/drafts" icon="📂" label="Drafts" />
              <SidebarLink href="/admin/users" icon="👥" label="Manage Users" />
            </>
          )}

        </nav>

        {/* USER PROFILE */}
        <div className="p-4 border-t border-zinc-800">

          <div className="flex items-center gap-3">

            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
              {user.initial}
            </div>

            <div className="min-w-0">

              <p className="text-sm font-medium truncate">
                {user.name}
              </p>

              <p className="text-xs text-zinc-500 capitalize">
                {user.role.toLowerCase()}
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto p-8">

        {/* GOOGLE NOTICE */}
        <GooglePasswordNotice provider={user.provider} />

        <div className="max-w-6xl mx-auto">
          {children}
        </div>

      </main>

    </div>
  );
}

/* ================= LINK ================= */

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-zinc-900"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}