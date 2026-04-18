'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: string;
  type: string;
  scoring_mode: string;
  question_text: string;
  question_text_zh: string | null;
  options: any;
  points: number;
}

interface GuessFormProps {
  matchId: string;
  questions: Question[];
  userGuesses: Record<string, string>;
  isLocked: boolean;
  homeTeamName: string;
  awayTeamName: string;
}

export function GuessForm({
  matchId,
  questions,
  userGuesses,
  isLocked,
  homeTeamName,
  awayTeamName,
}: GuessFormProps) {
  const t = useTranslations('fifa2026');
  const tc = useTranslations('common');
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(userGuesses);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const winnerQuestions = questions.filter((q) => q.type === 'winner');
  const scoreQuestions = questions.filter((q) => q.type === 'score');
  const funQuestions = questions.filter((q) => q.type === 'fun');

  const setAnswer = (questionId: string, value: string) => {
    if (isLocked) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (isLocked) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      for (const [questionId, answer] of Object.entries(answers)) {
        if (!answer) continue;
        await supabase.from('user_guesses').upsert(
          {
            user_id: user.id,
            question_id: questionId,
            answer,
            guessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,question_id' }
        );
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Failed to save guesses:', err);
    } finally {
      setSaving(false);
    }
  };

  const parseOptions = (options: any): string[] => {
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch {
        return [];
      }
    }
    if (Array.isArray(options)) return options;
    return [];
  };

  return (
    <div className="space-y-4">
      {/* Winner Questions */}
      {winnerQuestions.map((q) => {
        const opts = parseOptions(q.options);
        const labels: Record<string, string> = {
          home: homeTeamName,
          draw: 'Draw',
          away: awayTeamName,
        };

        return (
          <motion.section
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                {t('matchWinner')}
              </h3>
              <span className="text-xs text-muted-foreground">+{q.points} pts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {opts.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, opt)}
                  disabled={isLocked}
                  className={cn(
                    'rounded-lg border p-3 text-center text-sm font-medium transition-all',
                    answers[q.id] === opt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                    isLocked && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {labels[opt] || opt}
                </button>
              ))}
            </div>
          </motion.section>
        );
      })}

      {/* Score Questions */}
      {scoreQuestions.map((q) => (
        <motion.section
          key={q.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {t('exactScore')}
            </h3>
            <span className="text-xs text-muted-foreground">+{q.points} pts</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{homeTeamName}</p>
              <input
                type="number"
                min="0"
                max="20"
                disabled={isLocked}
                value={answers[q.id]?.split('-')[0] || ''}
                onChange={(e) => {
                  const away = answers[q.id]?.split('-')[1] || '0';
                  setAnswer(q.id, `${e.target.value}-${away}`);
                }}
                className={cn(
                  'w-16 h-12 rounded-lg border border-border bg-background text-center text-lg font-bold text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  isLocked && 'opacity-60 cursor-not-allowed'
                )}
              />
            </div>
            <span className="text-lg font-bold text-muted-foreground mt-4">-</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{awayTeamName}</p>
              <input
                type="number"
                min="0"
                max="20"
                disabled={isLocked}
                value={answers[q.id]?.split('-')[1] || ''}
                onChange={(e) => {
                  const home = answers[q.id]?.split('-')[0] || '0';
                  setAnswer(q.id, `${home}-${e.target.value}`);
                }}
                className={cn(
                  'w-16 h-12 rounded-lg border border-border bg-background text-center text-lg font-bold text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  isLocked && 'opacity-60 cursor-not-allowed'
                )}
              />
            </div>
          </div>
        </motion.section>
      ))}

      {/* Fun Questions */}
      {funQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('funQuestions')}
          </h3>
          {funQuestions.map((q, i) => {
            const opts = parseOptions(q.options);
            return (
              <motion.section
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 2) }}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    {q.question_text_zh || q.question_text}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    +{q.points} pts
                  </span>
                </div>
                <div className="flex gap-2">
                  {opts.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id, opt)}
                      disabled={isLocked}
                      className={cn(
                        'flex-1 rounded-lg border p-2.5 text-center text-sm transition-all',
                        answers[q.id] === opt
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-primary/50',
                        isLocked && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* Submit */}
      {!isLocked && (
        <Button
          onClick={handleSubmit}
          disabled={saving || isPending}
          className="w-full h-12 text-base font-semibold"
        >
          {saving ? tc('loading') : tc('submit')}
        </Button>
      )}
    </div>
  );
}
