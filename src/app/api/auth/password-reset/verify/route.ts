import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=Invalid+Link', request.url)
    );
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('reset_token', token)
    .gt('reset_token_expiry', new Date().toISOString())
    .single();

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=Expired+or+Invalid+Link', request.url)
    );
  }

  const response = NextResponse.redirect(
    new URL('/reset-password', request.url)
  );

  response.cookies.set('reset_flow_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1800,
    path: '/',
  });

  return response;
}
