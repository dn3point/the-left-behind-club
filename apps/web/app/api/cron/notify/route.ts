import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Vercel Cron calls this route on a schedule
// Checks for matches starting in the next 2 hours and sends reminders
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Find matches that lock within 2 hours
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select(`
      id, match_number, lock_at, starts_at, stage, group_name,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code)
    `)
    .eq('status', 'scheduled')
    .gte('lock_at', now.toISOString())
    .lte('lock_at', twoHoursFromNow.toISOString());

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return NextResponse.json({ message: 'No upcoming matches to notify about' });
  }

  // Get all whitelisted users
  const { data: users } = await supabase
    .from('users')
    .select('id, email, name');

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No users to notify' });
  }

  let sentCount = 0;

  for (const match of upcomingMatches) {
    const home = (match.home_team as any)?.name || 'TBD';
    const away = (match.away_team as any)?.name || 'TBD';
    const homeCode = (match.home_team as any)?.code || '???';
    const awayCode = (match.away_team as any)?.code || '???';

    // Find users who haven't guessed yet for this match
    const { data: questions } = await supabase
      .from('guess_questions')
      .select('id')
      .eq('match_id', match.id);

    const questionIds = (questions || []).map((q: any) => q.id);

    for (const user of users) {
      // Check if user has guessed
      if (questionIds.length > 0) {
        const { data: guesses } = await supabase
          .from('user_guesses')
          .select('id')
          .eq('user_id', user.id)
          .in('question_id', questionIds)
          .limit(1);

        if (guesses && guesses.length > 0) continue; // Already guessed
      }

      // Send reminder email
      const lockTime = new Date(match.lock_at);
      const minutesLeft = Math.round(
        (lockTime.getTime() - now.getTime()) / (60 * 1000)
      );

      try {
        await getResend().emails.send({
          from: 'The Left-Behind Club <noreply@yourdomain.com>',
          to: user.email,
          subject: `⚽ ${homeCode} vs ${awayCode} — Guess before it locks!`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">The Left-Behind Club</h2>
              <p>Hey ${user.name || 'friend'},</p>
              <p>
                <strong>${home} vs ${away}</strong> is coming up!
                You have <strong>${minutesLeft} minutes</strong> left to make your guess.
              </p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/fifa2026/matches/${match.id}"
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Guess Now
                </a>
              </p>
              <p style="color: #666; font-size: 12px;">
                Don't miss out on the points!
              </p>
            </div>
          `,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
      }
    }
  }

  return NextResponse.json({
    message: `Sent ${sentCount} reminder emails for ${upcomingMatches.length} matches`,
  });
}
