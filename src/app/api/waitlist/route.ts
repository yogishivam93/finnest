import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

const WELCOME_SUBJECT = "Welcome to FinNest -- and thank you for believing in the journey.";
const WELCOME_BODY = `Hi there,

Thank you for joining the FinNest waitlist.
Your support means more than you know.

FinNest started with a simple but powerful thought:
"Why do families worry about important information slipping through the cracks?"

I've seen it myself -- scattered documents, forgotten accounts, emergency details no one can find when they need them most.
I wanted to build something that brings clarity, peace of mind, and confidence back into every home.

FinNest is still growing, but every new feature is designed to do one thing:
Make life easier for you and the people you love.

I'll share progress updates, new releases, and early access invites as we move forward.
Thank you again for being part of the very first chapter of this journey.

Warm regards,
Shivam
Founder, FinNest`;

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const { email, source = "homepage" } = await request.json().catch(() => ({}));

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const { error: waitlistError } = await supabaseAdmin
      .from("waitlist")
      .insert({ email, source })
      .select("id")
      .single();

    if (waitlistError) {
      if (waitlistError.code === "23505") {
        return NextResponse.json({ error: "You're already on the waitlist with this email." }, { status: 409 });
      }
      // eslint-disable-next-line no-console
      console.error("waitlist insert failed", waitlistError);
      return NextResponse.json(
        { error: "Unable to add to the waitlist.", details: waitlistError.message, code: waitlistError.code },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("events")
      .insert({ event_name: "waitlist_join", page: "/", timestamp: new Date().toISOString() })
      .then(({ error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn("Failed to persist waitlist event", error);
        }
      });

    if (resendApiKey && resendFrom) {
      const resend = new Resend(resendApiKey);

      const { error: emailError } = await resend.emails.send({
        from: resendFrom,
        to: email,
        subject: WELCOME_SUBJECT,
        text: WELCOME_BODY,
      });

      if (emailError) {
        return NextResponse.json({ error: "Waitlist saved, but email failed to send." }, { status: 500 });
      }
    } else {
      // Email service not configured yet; waitlist still saved.
      return NextResponse.json({ ok: true, emailSent: false, message: "Waitlist joined; email not configured yet." });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("waitlist route crashed", err);
    return NextResponse.json(
      { error: "Waitlist failed unexpectedly.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
