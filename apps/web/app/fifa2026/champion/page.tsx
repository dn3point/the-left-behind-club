import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';

export default function ChampionGuessPage() {
  const t = useTranslations('fifa2026');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('champion')}
      </h2>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
        <div className="relative z-10">
          <h3 className="text-lg font-bold">🏆 {t('champion')}</h3>
          <p className="mt-1 text-sm text-white/80">
            10 {t('points')}
          </p>
        </div>
        <Trophy className="absolute -bottom-4 -right-4 h-28 w-28 text-white/10" />
      </div>

      <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-12 text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm">{t('noGuessYet')}</p>
        </div>
      </div>
    </div>
  );
}
