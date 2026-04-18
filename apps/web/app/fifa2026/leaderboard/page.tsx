import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Trophy, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default async function LeaderboardPage() {
  const t = await getTranslations('fifa2026');
  const supabase = await createClient();

  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select(`
      total_points, rank, breakdown,
      user:users!leaderboards_user_id_fkey(id, name, email, avatar_url)
    `)
    .order('total_points', { ascending: false });

  const entries = (leaderboard || []).map((entry: any, index: number) => ({
    rank: entry.rank || index + 1,
    totalPoints: entry.total_points,
    breakdown: entry.breakdown,
    user: entry.user,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('leaderboard')}
      </h2>

      {entries.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground">
          <div className="text-center space-y-2">
            <Trophy className="mx-auto h-8 w-8" />
            <p className="text-sm">{t('noGuessYet')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="flex items-end justify-center gap-2 py-4">
              {/* 2nd place */}
              <PodiumCard entry={entries[1]} position={2} />
              {/* 1st place */}
              <PodiumCard entry={entries[0]} position={1} />
              {/* 3rd place */}
              <PodiumCard entry={entries[2]} position={3} />
            </div>
          )}

          {/* Full List */}
          <div className="space-y-2">
            {entries.map((entry: any) => (
              <div
                key={entry.user?.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border border-border bg-card p-3',
                  entry.rank <= 3 && 'border-primary/30'
                )}
              >
                <div className="w-8 text-center">
                  {entry.rank <= 3 ? (
                    <RankMedal rank={entry.rank} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>

                <Avatar className="h-8 w-8">
                  {entry.user?.avatar_url && (
                    <AvatarImage src={entry.user.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs">
                    {(entry.user?.name || entry.user?.email || '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.user?.name || entry.user?.email?.split('@')[0]}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {entry.totalPoints}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t('points')}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  position,
}: {
  entry: any;
  position: number;
}) {
  const heights: Record<number, string> = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
  const sizes: Record<number, string> = { 1: 'h-12 w-12', 2: 'h-10 w-10', 3: 'h-10 w-10' };

  return (
    <div className="flex flex-col items-center gap-1">
      <Avatar className={sizes[position]}>
        {entry.user?.avatar_url && <AvatarImage src={entry.user.avatar_url} />}
        <AvatarFallback className="text-xs">
          {(entry.user?.name || entry.user?.email || '?')
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <p className="text-xs font-medium text-foreground truncate max-w-[80px]">
        {entry.user?.name || entry.user?.email?.split('@')[0]}
      </p>
      <p className="text-xs font-bold text-primary">{entry.totalPoints} pts</p>
      <div
        className={cn(
          'w-20 rounded-t-lg flex items-start justify-center pt-2',
          heights[position],
          position === 1 && 'bg-gradient-to-b from-amber-500/30 to-amber-500/10',
          position === 2 && 'bg-gradient-to-b from-gray-400/30 to-gray-400/10',
          position === 3 && 'bg-gradient-to-b from-orange-600/30 to-orange-600/10'
        )}
      >
        <RankMedal rank={position} />
      </div>
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: 'text-amber-400',
    2: 'text-gray-300',
    3: 'text-orange-400',
  };
  return <Medal className={cn('h-5 w-5', colors[rank] || 'text-muted-foreground')} />;
}
