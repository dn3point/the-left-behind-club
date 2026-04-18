import { useTranslations } from 'next-intl';
import { ClipboardList } from 'lucide-react';

export default function MyGuessesPage() {
  const t = useTranslations('fifa2026');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('myGuesses')}
      </h2>

      <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground">
        <div className="text-center space-y-2">
          <ClipboardList className="mx-auto h-8 w-8" />
          <p className="text-sm">{t('noGuessYet')}</p>
        </div>
      </div>
    </div>
  );
}
