// FIFA World Cup 2026 - Match Schedule
// Group stage: June 11 - June 28, 2026
// Round of 32: July 1 - July 4
// Round of 16: July 5 - July 8
// Quarter-finals: July 9 - July 10
// Semi-finals: July 13 - July 14
// Third-place: July 18
// Final: July 19

// Venues across US, Canada, Mexico
const venues = {
  // US
  metlife: 'MetLife Stadium, New Jersey',
  sofi: 'SoFi Stadium, Los Angeles',
  at_t: 'AT&T Stadium, Dallas',
  hard_rock: 'Hard Rock Stadium, Miami',
  mercedes: 'Mercedes-Benz Stadium, Atlanta',
  lincoln: 'Lincoln Financial Field, Philadelphia',
  lumen: 'Lumen Field, Seattle',
  levis: "Levi's Stadium, San Francisco",
  nrg: 'NRG Stadium, Houston',
  arrowhead: 'GEHA Field at Arrowhead Stadium, Kansas City',
  gillette: 'Gillette Stadium, Boston',
  // Canada
  bmo: 'BMO Field, Toronto',
  bc_place: 'BC Place, Vancouver',
  // Mexico
  azteca: 'Estadio Azteca, Mexico City',
  akron: 'Estadio Akron, Guadalajara',
  bbva: 'Estadio BBVA, Monterrey',
};

type Venue = keyof typeof venues;

interface GroupMatch {
  homeIndex: number; // index within the group (0-3)
  awayIndex: number;
  day: number; // day offset from June 11
  hour: number; // UTC hour
  venue: Venue;
}

// Each group plays 6 matches (round-robin of 4 teams)
// Matchday 1: 0v1, 2v3
// Matchday 2: 0v2, 1v3
// Matchday 3: 0v3, 1v2
const groupMatchTemplate: GroupMatch[] = [
  // Matchday 1
  { homeIndex: 0, awayIndex: 1, day: 0, hour: 18, venue: 'metlife' },
  { homeIndex: 2, awayIndex: 3, day: 0, hour: 21, venue: 'sofi' },
  // Matchday 2
  { homeIndex: 0, awayIndex: 2, day: 4, hour: 18, venue: 'at_t' },
  { homeIndex: 1, awayIndex: 3, day: 4, hour: 21, venue: 'hard_rock' },
  // Matchday 3
  { homeIndex: 0, awayIndex: 3, day: 8, hour: 20, venue: 'mercedes' },
  { homeIndex: 1, awayIndex: 2, day: 8, hour: 20, venue: 'lincoln' },
];

const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Stagger groups across days so there are ~6 matches per day
const groupDayOffsets: Record<string, number> = {
  A: 0, B: 0, C: 1, D: 1, E: 2, F: 2,
  G: 3, H: 3, I: 3, J: 4, K: 4, L: 4,
};

// Rotate venues per group to spread them out
const groupVenues: Record<string, Venue[]> = {
  A: ['metlife', 'sofi', 'at_t', 'hard_rock', 'mercedes', 'lincoln'],
  B: ['azteca', 'akron', 'lumen', 'nrg', 'levis', 'arrowhead'],
  C: ['bbva', 'bmo', 'bc_place', 'metlife', 'sofi', 'at_t'],
  D: ['hard_rock', 'mercedes', 'lincoln', 'lumen', 'levis', 'arrowhead'],
  E: ['bmo', 'bc_place', 'azteca', 'akron', 'bbva', 'nrg'],
  F: ['gillette', 'metlife', 'sofi', 'at_t', 'hard_rock', 'mercedes'],
  G: ['lincoln', 'lumen', 'levis', 'arrowhead', 'gillette', 'nrg'],
  H: ['azteca', 'akron', 'bbva', 'bmo', 'bc_place', 'metlife'],
  I: ['sofi', 'at_t', 'hard_rock', 'mercedes', 'lincoln', 'lumen'],
  J: ['levis', 'arrowhead', 'gillette', 'nrg', 'azteca', 'akron'],
  K: ['bbva', 'bmo', 'bc_place', 'metlife', 'sofi', 'at_t'],
  L: ['hard_rock', 'mercedes', 'lincoln', 'lumen', 'levis', 'arrowhead'],
};

export interface MatchSeed {
  stage: string;
  groupName: string | null;
  matchNumber: number;
  homeTeamCode: string; // will be resolved to team code within the group
  awayTeamCode: string;
  startsAt: Date;
  lockAt: Date;
  venue: string;
}

export function generateGroupMatches(
  teamsByGroup: Record<string, { code: string }[]>
): MatchSeed[] {
  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  const baseDate = new Date('2026-06-11T00:00:00Z');

  for (const group of groups) {
    const groupTeams = teamsByGroup[group];
    if (!groupTeams || groupTeams.length !== 4) continue;

    const dayOffset = groupDayOffsets[group];
    const venueList = groupVenues[group];

    groupMatchTemplate.forEach((template, i) => {
      const matchDay = new Date(baseDate);
      matchDay.setDate(matchDay.getDate() + template.day + dayOffset);
      matchDay.setUTCHours(template.hour, 0, 0, 0);

      // Lock 30 minutes before kick-off
      const lockTime = new Date(matchDay);
      lockTime.setMinutes(lockTime.getMinutes() - 30);

      matches.push({
        stage: 'group',
        groupName: group,
        matchNumber: matchNumber++,
        homeTeamCode: groupTeams[template.homeIndex].code,
        awayTeamCode: groupTeams[template.awayIndex].code,
        startsAt: matchDay,
        lockAt: lockTime,
        venue: venues[venueList[i]],
      });
    });
  }

  return matches;
}

// Knockout stage placeholders (teams TBD)
export function generateKnockoutMatches(): Omit<MatchSeed, 'homeTeamCode' | 'awayTeamCode'>[] {
  const knockoutMatches: Omit<MatchSeed, 'homeTeamCode' | 'awayTeamCode'>[] = [];
  let matchNumber = 73; // after 72 group matches

  const stages = [
    { stage: 'round_of_32', count: 16, startDate: '2026-07-01', perDay: 4 },
    { stage: 'round_of_16', count: 8, startDate: '2026-07-05', perDay: 4 },
    { stage: 'quarter_final', count: 4, startDate: '2026-07-09', perDay: 2 },
    { stage: 'semi_final', count: 2, startDate: '2026-07-13', perDay: 1 },
    { stage: 'third_place', count: 1, startDate: '2026-07-18', perDay: 1 },
    { stage: 'final', count: 1, startDate: '2026-07-19', perDay: 1 },
  ];

  const knockoutVenues: Venue[] = [
    'metlife', 'sofi', 'at_t', 'hard_rock',
    'mercedes', 'azteca', 'lincoln', 'lumen',
  ];

  for (const { stage, count, startDate, perDay } of stages) {
    const base = new Date(`${startDate}T00:00:00Z`);

    for (let i = 0; i < count; i++) {
      const dayOffset = Math.floor(i / perDay);
      const matchTime = new Date(base);
      matchTime.setDate(matchTime.getDate() + dayOffset);
      matchTime.setUTCHours(18 + (i % perDay) * 3, 0, 0, 0);

      const lockTime = new Date(matchTime);
      lockTime.setMinutes(lockTime.getMinutes() - 30);

      knockoutMatches.push({
        stage,
        groupName: null,
        matchNumber: matchNumber++,
        startsAt: matchTime,
        lockAt: lockTime,
        venue: venues[knockoutVenues[i % knockoutVenues.length]],
      });
    }
  }

  return knockoutMatches;
}
