'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Trophy, Construction, Globe } from 'lucide-react';

const modules = [
  {
    slug: 'fifa2026',
    icon: Trophy,
    gradient: 'from-emerald-600 to-cyan-600',
  },
];

export default function PortalPage() {
  const t = useTranslations('portal');
  const tc = useTranslations('common');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="w-8" />
          <h1 className="text-sm font-semibold text-foreground">
            {t('title')}
          </h1>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2 mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </motion.div>

        {/* Module Cards */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('modules')}
          </h3>

          {modules.map((mod, i) => (
            <motion.div
              key={mod.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (i + 1) }}
            >
              <Link
                href={`/${mod.slug}`}
                className={`block relative overflow-hidden rounded-2xl bg-gradient-to-br ${mod.gradient} p-6 text-white transition-transform active:scale-[0.98]`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold">
                        FIFA World Cup 2026
                      </h4>
                      <p className="mt-1 text-sm text-white/70">
                        {t('moduleDescFifa')}
                      </p>
                    </div>
                    <mod.icon className="h-8 w-8 text-white/60" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* WIP Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center justify-center rounded-2xl border border-dashed border-border py-12 text-muted-foreground"
          >
            <div className="text-center space-y-2">
              <Construction className="mx-auto h-8 w-8" />
              <p className="text-sm">{tc('wip')}</p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

function LanguageToggle() {
  const handleToggle = () => {
    const current = document.cookie
      .split('; ')
      .find((row) => row.startsWith('locale='))
      ?.split('=')[1];
    const next = current === 'en' ? 'zh' : 'en';
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  };

  return (
    <button
      onClick={handleToggle}
      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle language"
    >
      <Globe className="h-5 w-5" />
    </button>
  );
}
