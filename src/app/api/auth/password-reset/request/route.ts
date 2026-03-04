import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    // Always return success message (security best practice)
    if (!user) {
      return NextResponse.json({
        message:
          "If this email exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(
      Date.now() + 1000 * 60 * 60
    ).toISOString();

    await supabaseAdmin
      .from("users")
      .update({
        reset_token: token,
        reset_token_expiry: expiry,
      })
      .eq("id", user.id);

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "CEIVoice <noreply@ceivoice.com>",
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial; padding: 40px;">
          <h2>Reset Your Password</h2>
          <p>This link expires in 1 hour.</p>
          <a href="${resetLink}" 
             style="display:inline-block;padding:12px 24px;
             background:#2563eb;color:white;
             text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </div>
      `,
    });

    return NextResponse.json({
      message:
        "If this email exists, a reset link has been sent.",
    });

  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
