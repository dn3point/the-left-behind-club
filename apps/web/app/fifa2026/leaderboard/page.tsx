import { useTranslations } from 'next-intl';
import { BarChart3 } from 'lucide-react';

export default function LeaderboardPage() {
  const t = useTranslations('fifa2026');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('leaderboard')}
      </h2>

      <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground">
        <div className="text-center space-y-2">
          <BarChart3 className="mx-auto h-8 w-8" />
          <p className="text-sm">{t('noGuessYet')}</p>
        </div>
      </div>
    </div>
  );
}
