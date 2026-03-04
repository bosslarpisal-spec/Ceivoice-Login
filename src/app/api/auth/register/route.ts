import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase();

    /* ---------- Check Existing ---------- */

    const { data: existing, error } = await supabaseAdmin
      .from('users')
      .select('id, provider')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (existing) {
      if (existing.provider === 'google') {
        return NextResponse.json(
          { error: 'Please sign in with Google' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    /* ---------- Hash Password ---------- */

    const hashed = await hashPassword(password);

    /* ---------- Create User ---------- */

    const { data: user, error: insertError } =
      await supabaseAdmin
        .from('users')
        .insert({
          email: lowerEmail,
          password_hash: hashed,
          full_name: name || lowerEmail,
          role: 'USER',
          provider: 'local',
        })
        .select()
        .single();

    if (insertError || !user) {
      return NextResponse.json(
        { error: insertError?.message || 'User creation failed' },
        { status: 500 }
      );
    }

    /* ---------- JWT ---------- */

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    /* ---------- Response ---------- */

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (err) {
    console.error('Register error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}