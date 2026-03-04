import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, name, googleId } = await req.json();

    if (!email || !googleId) {
      return NextResponse.json(
        { error: 'Missing Google data' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle();

    let user = existing;

    /* CREATE IF NEW */

    if (!user) {
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: lowerEmail,
          full_name: name || '',
          provider: 'google',
          google_id: googleId,
          role: 'USER',
        })
        .select()
        .single();

        if (error || !newUser) {
          console.error('Supabase error:', error);
        
          return NextResponse.json(
            { error: error?.message || 'User creation failed' },
            { status: 500 }
          );
        }

      user = newUser;
    }

    /* JWT */

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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
    console.error('Google auth error:', err);

    return NextResponse.json(
      { error: 'Google auth failed' },
      { status: 500 }
    );
  }
}