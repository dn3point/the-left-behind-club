import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '../schema';
import { generateFunQuestions } from '../seed/fun-questions';
import 'dotenv/config';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54392/postgres';

async function main() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  // Get all group matches that don't have fun questions yet
  const allMatches = await db
    .select({
      match: schema.matches,
      homeTeam: schema.teams,
    })
    .from(schema.matches)
    .leftJoin(schema.teams, eq(schema.matches.homeTeamId, schema.teams.id))
    .where(eq(schema.matches.stage, 'group'));

  // Get away teams separately
  const awayTeamsMap: Record<string, typeof schema.teams.$inferSelect> = {};
  for (const m of allMatches) {
    if (m.match.awayTeamId) {
      const [away] = await db
        .select()
        .from(schema.teams)
        .where(eq(schema.teams.id, m.match.awayTeamId));
      if (away) awayTeamsMap[m.match.id] = away;
    }
  }

  let generated = 0;
  for (const { match, homeTeam } of allMatches) {
    const awayTeam = awayTeamsMap[match.id];
    if (!homeTeam || !awayTeam) continue;

    // Check existing fun questions
    const existing = await db
      .select()
      .from(schema.guessQuestions)
      .where(
        and(
          eq(schema.guessQuestions.matchId, match.id),
          eq(schema.guessQuestions.type, 'fun')
        )
      );

    if (existing.length >= 5) {
      console.log(`Skip match #${match.matchNumber}: already has ${existing.length} fun questions`);
      continue;
    }

    const needed = 5 - existing.length;
    console.log(`Match #${match.matchNumber}: ${homeTeam.name} vs ${awayTeam.name} - generating ${needed} questions...`);

    const questions = await generateFunQuestions(
      homeTeam.name,
      homeTeam.nameZh || homeTeam.name,
      awayTeam.name,
      awayTeam.nameZh || awayTeam.name,
      needed
    );

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db.insert(schema.guessQuestions).values({
        matchId: match.id,
        tournamentId: match.tournamentId,
        type: 'fun',
        scoringMode: q.scoringMode,
        questionText: q.questionText,
        questionTextZh: q.questionTextZh,
        options: JSON.stringify(q.options),
        points: 2,
        sortOrder: 10 + existing.length + i,
      });
    }
    generated++;
  }

  console.log(`\nDone. Generated fun questions for ${generated} matches.`);
  await client.end();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
