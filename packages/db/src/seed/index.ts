import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import { teams as teamData } from './teams';
import { generateGroupMatches, generateKnockoutMatches } from './matches';
import { generateFunQuestions } from './fun-questions';
import 'dotenv/config';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54392/postgres';

async function seed() {
  console.log('Connecting to database...');
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  // 1. Get or create the FIFA 2026 module
  console.log('Finding or creating FIFA 2026 module...');
  let [tournament] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.slug, 'fifa2026'));

  if (!tournament) {
    console.log('FIFA 2026 module not found, creating...');
    [tournament] = await db
      .insert(schema.modules)
      .values({
        slug: 'fifa2026',
        name: 'FIFA World Cup 2026',
        nameZh: '2026年FIFA世界杯',
        description: 'Predict matches & win glory',
        descriptionZh: '预测比赛，赢取荣耀',
        type: 'tournament',
        status: 'active',
      })
      .returning();
  }

  console.log(`Tournament ID: ${tournament.id}`);

  // 2. Seed teams
  console.log('Seeding 48 teams...');
  const insertedTeams: Record<string, string> = {}; // code -> id

  for (const team of teamData) {
    const [inserted] = await db
      .insert(schema.teams)
      .values({
        tournamentId: tournament.id,
        name: team.name,
        nameZh: team.nameZh,
        code: team.code,
        flagUrl: `https://flagcdn.com/w80/${team.code.toLowerCase().slice(0, 2)}.png`,
        groupName: team.group,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      insertedTeams[team.code] = inserted.id;
      console.log(`  + ${team.name} (${team.code}) -> Group ${team.group}`);
    } else {
      // Already exists, fetch ID
      const [existing] = await db
        .select()
        .from(schema.teams)
        .where(eq(schema.teams.code, team.code));
      if (existing) {
        insertedTeams[team.code] = existing.id;
      }
    }
  }

  console.log(`Seeded ${Object.keys(insertedTeams).length} teams`);

  // 3. Generate and seed group stage matches
  const teamsByGroup: Record<string, { code: string }[]> = {};
  for (const team of teamData) {
    if (!teamsByGroup[team.group]) teamsByGroup[team.group] = [];
    teamsByGroup[team.group].push({ code: team.code });
  }

  const groupMatches = generateGroupMatches(teamsByGroup);
  console.log(`\nSeeding ${groupMatches.length} group stage matches...`);

  for (const match of groupMatches) {
    const [inserted] = await db
      .insert(schema.matches)
      .values({
        tournamentId: tournament.id,
        stage: match.stage,
        groupName: match.groupName,
        matchNumber: match.matchNumber,
        homeTeamId: insertedTeams[match.homeTeamCode],
        awayTeamId: insertedTeams[match.awayTeamCode],
        status: 'scheduled',
        startsAt: match.startsAt,
        lockAt: match.lockAt,
        venue: match.venue,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      console.log(
        `  Match #${match.matchNumber}: ${match.homeTeamCode} vs ${match.awayTeamCode} (${match.groupName}) - ${match.startsAt.toISOString().slice(0, 10)}`
      );
    }
  }

  // 4. Generate knockout matches (no teams assigned yet)
  const knockoutMatches = generateKnockoutMatches();
  console.log(`\nSeeding ${knockoutMatches.length} knockout stage matches...`);

  for (const match of knockoutMatches) {
    const [inserted] = await db
      .insert(schema.matches)
      .values({
        tournamentId: tournament.id,
        stage: match.stage,
        groupName: match.groupName,
        matchNumber: match.matchNumber,
        status: 'scheduled',
        startsAt: match.startsAt,
        lockAt: match.lockAt,
        venue: match.venue,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      console.log(`  Match #${match.matchNumber}: ${match.stage}`);
    }
  }

  // 5. Seed default guess questions for group matches
  console.log('\nSeeding guess questions for group matches...');
  const allMatches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.stage, 'group'));

  for (const match of allMatches) {
    // Winner question
    await db
      .insert(schema.guessQuestions)
      .values({
        matchId: match.id,
        tournamentId: tournament.id,
        type: 'winner',
        scoringMode: 'exact',
        questionText: 'Who will win this match?',
        questionTextZh: '谁会赢得这场比赛？',
        options: JSON.stringify(['home', 'draw', 'away']),
        points: 3,
        sortOrder: 0,
      })
      .onConflictDoNothing();

    // Exact score question
    await db
      .insert(schema.guessQuestions)
      .values({
        matchId: match.id,
        tournamentId: tournament.id,
        type: 'score',
        scoringMode: 'exact',
        questionText: 'Predict the exact score',
        questionTextZh: '预测精确比分',
        options: JSON.stringify({ type: 'score_input' }),
        points: 5,
        sortOrder: 1,
      })
      .onConflictDoNothing();
  }

  console.log(`Created winner + score questions for ${allMatches.length} matches`);

  // 6. Generate fun questions for group matches
  const skipFun = process.env.SKIP_FUN_QUESTIONS === 'true';
  if (!skipFun) {
    console.log('\nGenerating fun questions for group matches...');
    // Build a lookup: teamId -> team info
    const teamLookup: Record<string, { name: string; nameZh: string }> = {};
    for (const team of teamData) {
      const id = insertedTeams[team.code];
      if (id) teamLookup[id] = { name: team.name, nameZh: team.nameZh };
    }

    let funCount = 0;
    for (const match of allMatches) {
      const home = match.homeTeamId ? teamLookup[match.homeTeamId] : null;
      const away = match.awayTeamId ? teamLookup[match.awayTeamId] : null;
      if (!home || !away) continue;

      // Check if fun questions already exist for this match
      const existing = await db
        .select()
        .from(schema.guessQuestions)
        .where(eq(schema.guessQuestions.matchId, match.id));
      const hasFun = existing.some((q) => q.type === 'fun');
      if (hasFun) {
        console.log(`  Skipping match #${match.matchNumber} (already has fun questions)`);
        continue;
      }

      const funQuestions = await generateFunQuestions(
        home.name,
        home.nameZh,
        away.name,
        away.nameZh,
        5
      );

      for (let i = 0; i < funQuestions.length; i++) {
        const q = funQuestions[i];
        await db.insert(schema.guessQuestions).values({
          matchId: match.id,
          tournamentId: tournament.id,
          type: 'fun',
          scoringMode: q.scoringMode,
          questionText: q.questionText,
          questionTextZh: q.questionTextZh,
          options: JSON.stringify(q.options),
          points: 2,
          sortOrder: 10 + i,
        });
      }

      funCount++;
      console.log(
        `  Match #${match.matchNumber}: ${home.name} vs ${away.name} - ${funQuestions.length} fun questions`
      );
    }

    console.log(`Generated fun questions for ${funCount} matches`);
  } else {
    console.log('\nSkipping fun questions (SKIP_FUN_QUESTIONS=true)');
  }

  // Summary
  const totalMatches = groupMatches.length + knockoutMatches.length;
  console.log(`\n✅ Seed complete!`);
  console.log(`   Teams: ${Object.keys(insertedTeams).length}`);
  console.log(`   Group matches: ${groupMatches.length}`);
  console.log(`   Knockout matches: ${knockoutMatches.length}`);
  console.log(`   Total matches: ${totalMatches}`);

  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
