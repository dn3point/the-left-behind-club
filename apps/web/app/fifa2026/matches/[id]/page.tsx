import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { GuessForm } from './guess-form';

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations('fifa2026');
  const supabase = await createClient();

  // Fetch match with teams
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (!match) notFound();

  // Fetch questions for this match
  const { data: questions } = await supabase
    .from('guess_questions')
    .select('*')
    .eq('match_id', id)
    .order('sort_order', { ascending: true });

  // Fetch current user's guesses
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userGuesses: Record<string, string> = {};
  if (user) {
    const questionIds = (questions || []).map((q: any) => q.id);
    if (questionIds.length > 0) {
      const { data: guesses } = await supabase
        .from('user_guesses')
        .select('*')
        .eq('user_id', user.id)
        .in('question_id', questionIds);

      for (const g of guesses || []) {
        userGuesses[g.question_id] = g.answer;
      }
    }
  }

  const isLocked = new Date(match.lock_at) <= new Date();
  const homeTeam = match.home_team as any;
  const awayTeam = match.away_team as any;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link
        href="/fifa2026/matches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('matches')}
      </Link>

      {/* Match Header */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {match.group_name ? `Group ${match.group_name}` : match.stage}
          </Badge>
          {isLocked ? (
            <Badge variant="secondary" className="text-xs">
              {t('guessLocked')}
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              {t('guessNow')}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">
              {homeTeam?.code || 'TBD'}
            </p>
            <p className="text-xs text-muted-foreground">{homeTeam?.name}</p>
          </div>

          <div className="px-6 text-center">
            {match.status === 'finished' || match.status === 'live' ? (
              <p className="text-2xl font-bold text-foreground">
                {match.home_score} - {match.away_score}
              </p>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">VS</p>
              </div>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">
              {awayTeam?.code || 'TBD'}
            </p>
            <p className="text-xs text-muted-foreground">{awayTeam?.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(match.starts_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </div>
          {match.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{match.venue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Guess Form */}
      <GuessForm
        matchId={id}
        questions={questions || []}
        userGuesses={userGuesses}
        isLocked={isLocked}
        homeTeamName={homeTeam?.name || 'Home'}
        awayTeamName={awayTeam?.name || 'Away'}
      />
    </div>
  );
}
