import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MatchWithTeams {
  id: string;
  matchNumber: number;
  stage: string;
  groupName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  startsAt: string;
  venue: string | null;
  homeTeam: { name: string; nameZh: string | null; code: string; flagUrl: string | null } | null;
  awayTeam: { name: string; nameZh: string | null; code: string; flagUrl: string | null } | null;
}

export default async function MatchesPage() {
  const t = await getTranslations('fifa2026');
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_number, stage, group_name, home_score, away_score, status, starts_at, venue,
      home_team:teams!matches_home_team_id_fkey(name, name_zh, code, flag_url),
      away_team:teams!matches_away_team_id_fkey(name, name_zh, code, flag_url)
    `)
    .eq('stage', 'group')
    .order('starts_at', { ascending: true });

  // Group matches by date
  const matchesByDate: Record<string, MatchWithTeams[]> = {};
  for (const m of matches || []) {
    const date = new Date(m.starts_at).toISOString().slice(0, 10);
    if (!matchesByDate[date]) matchesByDate[date] = [];
    matchesByDate[date].push({
      id: m.id,
      matchNumber: m.match_number,
      stage: m.stage,
      groupName: m.group_name,
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: m.status,
      startsAt: m.starts_at,
      venue: m.venue,
      homeTeam: m.home_team as any,
      awayTeam: m.away_team as any,
    });
  }

  const dates = Object.keys(matchesByDate).sort();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">{t('matches')}</h2>

      {dates.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground">
          <div className="text-center space-y-2">
            <CalendarDays className="mx-auto h-8 w-8" />
            <p className="text-sm">{t('noGuessYet')}</p>
          </div>
        </div>
      ) : (
        dates.map((date) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="font-medium">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="space-y-2">
              {matchesByDate[date].map((match) => (
                <Link
                  key={match.id}
                  href={`/fifa2026/matches/${match.id}`}
                  className="block rounded-xl border border-border bg-card p-3 transition-colors active:bg-accent/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      Group {match.groupName}
                    </Badge>
                    <StatusBadge status={match.status} />
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex-1 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {match.homeTeam?.code || '???'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {match.homeTeam?.name || 'TBD'}
                      </p>
                    </div>

                    {/* Score or Time */}
                    <div className="px-4 text-center min-w-[80px]">
                      {match.status === 'finished' || match.status === 'live' ? (
                        <p className="text-lg font-bold text-foreground">
                          {match.homeScore} - {match.awayScore}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.startsAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {match.awayTeam?.code || '???'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {match.awayTeam?.name || 'TBD'}
                      </p>
                    </div>
                  </div>

                  {match.venue && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{match.venue}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'live':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
          LIVE
        </Badge>
      );
    case 'finished':
      return (
        <Badge variant="secondary" className="text-[10px]">
          FT
        </Badge>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
        </div>
      );
  }
}
