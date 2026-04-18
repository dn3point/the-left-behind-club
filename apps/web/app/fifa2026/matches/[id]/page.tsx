import { useTranslations } from 'next-intl';

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = useTranslations('fifa2026');

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Match #{id}
      </h2>

      {/* Winner Guess */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('matchWinner')}
        </h3>
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('noGuessYet')}
        </div>
      </section>

      {/* Exact Score */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('exactScore')}
        </h3>
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('noGuessYet')}
        </div>
      </section>

      {/* Fun Questions */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('funQuestions')}
        </h3>
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('noGuessYet')}
        </div>
      </section>
    </div>
  );
}
