import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { TicketReceivedEmail } from '@/components/emails/TicketReceivedEmail';
import { publishToQueue } from '@/lib/rabbitmq'; 

if (!process.env.RESEND_API_KEY) {
  console.warn("WARNING: RESEND_API_KEY is not defined in environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Aligned keys with the frontend handleSubmit (email, subject, message)
    const { email, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Email, Subject, and Message are required' }, 
        { status: 400 }
      );
    }

    // 1. LOOKUP USER UUID BY EMAIL 
    // This connects the ticket to the existing user profile if they are registered
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    const userUuid = userData?.id || null;

    // 2. INSERT TICKET INTO SUPABASE
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          user_email: email,
          created_by: userUuid, // Maps the ticket to the user's UUID
          title: subject,        
          description: message,  
          status: 'NEW', // Changed from DRAFT to NEW so agents see it immediately
          origin: 'web'
        }
      ])
      .select()
      .single();

    if (ticketError) {
      console.error('Supabase Insert Error:', ticketError);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    // 3. RABBITMQ - SEND TO AI WORKER
    // This happens in the background for AI analysis (category/solution prediction)
    try {
      if (ticket) {
        await publishToQueue(ticket.id.toString(), ticket.description);
        console.log(`[RabbitMQ] ✅ Sent ticket #${ticket.id} to AI worker`);
      }
    } catch (queueErr) {
      console.error('[RabbitMQ] Failed to send to queue:', queueErr);
      // We don't throw here so the user still gets their confirmation email
    }

    // 4. RESEND - SEND CONFIRMATION EMAIL
    try {
      if (ticket) {
        await resend.emails.send({
          // เปลี่ยนจาก onboarding@resend.dev เป็นเมลภายใต้โดเมน ceivoice.com
          from: 'CEIVoice Support <support@ceivoice.com>', 
          to: email, 
          subject: `[Ticket #${ticket.id}] Request Received: ${subject}`,
          react: TicketReceivedEmail({ 
            ticketId: ticket.id.toString(), 
            title: subject 
          }),
        });
        console.log(`[Resend] ✅ Confirmation email sent to ${email}`);
      }
    } catch (emailErr) {
      console.error('[Resend] Service error:', emailErr);
    }

    // 5. RETURN SUCCESS
    return NextResponse.json({ trackingId: ticket.id }, { status: 201 });

  } catch (error: any) {
    console.error('Final API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}