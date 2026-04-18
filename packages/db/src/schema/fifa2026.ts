import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, modules } from './core';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  code: text('code').notNull(),
  flagUrl: text('flag_url'),
  groupName: text('group_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  tournament: one(modules, {
    fields: [teams.tournamentId],
    references: [modules.id],
  }),
  homeMatches: many(matches, { relationName: 'homeTeam' }),
  awayMatches: many(matches, { relationName: 'awayTeam' }),
}));

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  stage: text('stage').notNull(),
  groupName: text('group_name'),
  matchNumber: integer('match_number'),
  homeTeamId: uuid('home_team_id').references(() => teams.id),
  awayTeamId: uuid('away_team_id').references(() => teams.id),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  status: text('status').default('scheduled').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  lockAt: timestamp('lock_at', { withTimezone: true }).notNull(),
  venue: text('venue'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const matchesRelations = relations(matches, ({ one, many }) => ({
  tournament: one(modules, {
    fields: [matches.tournamentId],
    references: [modules.id],
  }),
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  questions: many(guessQuestions),
}));

export const guessQuestions = pgTable('guess_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }),
  tournamentId: uuid('tournament_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  scoringMode: text('scoring_mode').default('exact').notNull(),
  questionText: text('question_text').notNull(),
  questionTextZh: text('question_text_zh'),
  options: jsonb('options').notNull(),
  correctAnswer: text('correct_answer'),
  points: integer('points').default(3).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const guessQuestionsRelations = relations(guessQuestions, ({ one, many }) => ({
  match: one(matches, {
    fields: [guessQuestions.matchId],
    references: [matches.id],
  }),
  tournament: one(modules, {
    fields: [guessQuestions.tournamentId],
    references: [modules.id],
  }),
  guesses: many(userGuesses),
}));

export const userGuesses = pgTable(
  'user_guesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: uuid('question_id')
      .references(() => guessQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    answer: text('answer').notNull(),
    pointsEarned: integer('points_earned').default(0).notNull(),
    isCorrect: boolean('is_correct'),
    guessedAt: timestamp('guessed_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_guesses_user_question_idx').on(table.userId, table.questionId),
  ]
);

export const userGuessesRelations = relations(userGuesses, ({ one }) => ({
  user: one(users, {
    fields: [userGuesses.userId],
    references: [users.id],
  }),
  question: one(guessQuestions, {
    fields: [userGuesses.questionId],
    references: [guessQuestions.id],
  }),
}));

export const tournamentWinnerGuesses = pgTable(
  'tournament_winner_guesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tournamentId: uuid('tournament_id')
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    teamId: uuid('team_id')
      .references(() => teams.id)
      .notNull(),
    isLocked: boolean('is_locked').default(false).notNull(),
    pointsEarned: integer('points_earned').default(0).notNull(),
    guessedAt: timestamp('guessed_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('winner_guesses_user_tournament_idx').on(
      table.userId,
      table.tournamentId
    ),
  ]
);

export const tournamentWinnerGuessesRelations = relations(
  tournamentWinnerGuesses,
  ({ one }) => ({
    user: one(users, {
      fields: [tournamentWinnerGuesses.userId],
      references: [users.id],
    }),
    tournament: one(modules, {
      fields: [tournamentWinnerGuesses.tournamentId],
      references: [modules.id],
    }),
    team: one(teams, {
      fields: [tournamentWinnerGuesses.teamId],
      references: [teams.id],
    }),
  })
);

export const leaderboards = pgTable(
  'leaderboards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    totalPoints: integer('total_points').default(0).notNull(),
    rank: integer('rank'),
    breakdown: jsonb('breakdown'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('leaderboards_module_user_idx').on(table.moduleId, table.userId),
  ]
);

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  module: one(modules, {
    fields: [leaderboards.moduleId],
    references: [modules.id],
  }),
  user: one(users, {
    fields: [leaderboards.userId],
    references: [users.id],
  }),
}));
