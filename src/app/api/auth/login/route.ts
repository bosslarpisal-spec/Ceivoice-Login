import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    /* ================= Get Body ================= */

    const body = await req.json();

    const email: string = body.email;
    const password: string | undefined = body.password;

    /* ================= Validate ================= */

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();

    /* ================= Find User ================= */

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);

      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    /* ================= Provider Check ================= */

    // Google login only
    if (user.provider === 'google') {
      return NextResponse.json(
        { error: 'Please login with Google' },
        { status: 403 }
      );
    }

    /* ================= Password Check ================= */

    if (user.provider === 'email') {

      if (!password || typeof password !== 'string') {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      if (!user.password_hash) {
        return NextResponse.json(
          { error: 'Account has no password set' },
          { status: 403 }
        );
      }

      const validPassword = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!validPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    }

    /* ================= Create Token ================= */

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    /* ================= Response ================= */

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    /* ================= Fix: Clear Old Session ================= */

    // 🔥 Prevent wrong-user bug
    response.cookies.delete('auth_token');

    /* ================= Set Cookie ================= */

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (err) {

    console.error('Login error:', err);

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}