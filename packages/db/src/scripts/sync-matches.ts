import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import 'dotenv/config';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54392/postgres';

// Football-Data.org API (free tier, 10 req/min)
const FOOTBALL_DATA_API = 'https://api.football-data.org/v4';
const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN || '';

interface ApiMatch {
  id: number;
  matchday: number;
  status: string;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
  homeTeam: { tla: string };
  awayTeam: { tla: string };
}

async function fetchLiveScores(): Promise<ApiMatch[]> {
  if (!FOOTBALL_DATA_TOKEN) {
    console.warn('No FOOTBALL_DATA_TOKEN set. Using manual mode.');
    console.log('To sync scores automatically, set FOOTBALL_DATA_TOKEN in your environment.');
    return [];
  }

  try {
    const res = await fetch(`${FOOTBALL_DATA_API}/competitions/WC/matches`, {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
    });

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    return data.matches || [];
  } catch (err) {
    console.error('Failed to fetch scores:', err);
    return [];
  }
}

async function main() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  const apiMatches = await fetchLiveScores();

  if (apiMatches.length === 0) {
    console.log('No matches to sync. You can manually update scores in Supabase Studio.');
    await client.end();
    return;
  }

  // Get all teams for code lookup
  const teams = await db.select().from(schema.teams);
  const teamByCode: Record<string, string> = {};
  for (const t of teams) {
    teamByCode[t.code] = t.id;
  }

  let updated = 0;
  for (const apiMatch of apiMatches) {
    if (apiMatch.status !== 'FINISHED' && apiMatch.status !== 'IN_PLAY') continue;

    const homeId = teamByCode[apiMatch.homeTeam.tla];
    const awayId = teamByCode[apiMatch.awayTeam.tla];
    if (!homeId || !awayId) continue;

    // Find matching local match
    const [localMatch] = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.homeTeamId, homeId));

    if (!localMatch) continue;

    const homeScore = apiMatch.score.fullTime.home;
    const awayScore = apiMatch.score.fullTime.away;
    const status = apiMatch.status === 'FINISHED' ? 'finished' : 'live';

    await db
      .update(schema.matches)
      .set({
        homeScore,
        awayScore,
        status,
        updatedAt: new Date(),
      })
      .where(eq(schema.matches.id, localMatch.id));

    console.log(
      `Updated: ${apiMatch.homeTeam.tla} ${homeScore}-${awayScore} ${apiMatch.awayTeam.tla} (${status})`
    );
    updated++;
  }

  console.log(`\nSynced ${updated} matches.`);
  await client.end();
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
