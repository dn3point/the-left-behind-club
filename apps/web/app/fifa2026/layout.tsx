'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Trophy, ListChecks, BarChart3, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/fifa2026', icon: Home, labelKey: 'dashboard' },
  { href: '/fifa2026/matches', icon: ListChecks, labelKey: 'matches' },
  { href: '/fifa2026/champion', icon: Trophy, labelKey: 'champion' },
  { href: '/fifa2026/leaderboard', icon: BarChart3, labelKey: 'leaderboard' },
  { href: '/fifa2026/my-guesses', icon: User, labelKey: 'myGuesses' },
];

export default function FIFA2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations('fifa2026');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
          </Link>
          <h1 className="text-sm font-semibold text-foreground">
            {t('title')}
          </h1>
          <div className="w-5" />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/fifa2026'
                ? pathname === '/fifa2026'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-2 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
