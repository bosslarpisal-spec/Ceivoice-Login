import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, provider, password_hash, role')
      .eq('id', payload.userId)
      .single();

    return NextResponse.json({ user });

  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}