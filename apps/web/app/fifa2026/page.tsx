import { useTranslations } from 'next-intl';
import { Trophy, Timer, TrendingUp } from 'lucide-react';

export default function FIFA2026Dashboard() {
  const t = useTranslations('fifa2026');

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 p-6 text-white">
        <div className="relative z-10">
          <h2 className="text-xl font-bold">{t('title')}</h2>
          <p className="mt-1 text-sm text-white/80">{t('subtitle')}</p>
        </div>
        <Trophy className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">{t('yourRank')}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">--</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span className="text-xs">{t('points')}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">0</p>
        </div>
      </div>

      {/* Next Match Placeholder */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-medium">{t('nextMatch')}</span>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          {t('noGuessYet')}
        </div>
      </div>
    </div>
  );
}
