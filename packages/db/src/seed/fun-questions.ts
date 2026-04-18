import Anthropic from '@anthropic-ai/sdk';

export interface FunQuestion {
  questionText: string;
  questionTextZh: string;
  options: string[];
  scoringMode: 'exact' | 'majority';
  type: 'fun';
}

// Fallback question templates when Claude API is unavailable
const fallbackTemplates: ((home: string, homeZh: string, away: string, awayZh: string) => FunQuestion)[] = [
  (home, homeZh, away, awayZh) => ({
    questionText: `Which country has better food: ${home} or ${away}?`,
    questionTextZh: `哪个国家的美食更好：${homeZh}还是${awayZh}？`,
    options: [home, away],
    scoringMode: 'majority',
    type: 'fun',
  }),
  (home, _homeZh, away, _awayZh) => ({
    questionText: `Which team's jersey looks cooler?`,
    questionTextZh: `哪支球队的球衣更酷？`,
    options: [home, away],
    scoringMode: 'majority',
    type: 'fun',
  }),
  (home, homeZh, away, awayZh) => ({
    questionText: `Which country would you rather travel to: ${home} or ${away}?`,
    questionTextZh: `你更想去哪个国家旅游：${homeZh}还是${awayZh}？`,
    options: [home, away],
    scoringMode: 'majority',
    type: 'fun',
  }),
  (_home, _homeZh, _away, _awayZh) => ({
    questionText: `Will the total goals be odd or even?`,
    questionTextZh: `总进球数是奇数还是偶数？`,
    options: ['Odd', 'Even'],
    scoringMode: 'exact',
    type: 'fun',
  }),
  (_home, _homeZh, _away, _awayZh) => ({
    questionText: `Will there be a goal in the first 15 minutes?`,
    questionTextZh: `前15分钟会有进球吗？`,
    options: ['Yes', 'No'],
    scoringMode: 'exact',
    type: 'fun',
  }),
  (home, homeZh, away, awayZh) => ({
    questionText: `Which team's fans will be louder in the stadium?`,
    questionTextZh: `哪支球队的球迷在球场上更响亮？`,
    options: [home, away],
    scoringMode: 'majority',
    type: 'fun',
  }),
  (_home, _homeZh, _away, _awayZh) => ({
    questionText: `Will there be a red card in this match?`,
    questionTextZh: `这场比赛会有红牌吗？`,
    options: ['Yes', 'No'],
    scoringMode: 'exact',
    type: 'fun',
  }),
  (home, homeZh, away, awayZh) => ({
    questionText: `Pick the team whose national anthem slaps harder`,
    questionTextZh: `哪支球队的国歌更好听？`,
    options: [home, away],
    scoringMode: 'majority',
    type: 'fun',
  }),
  (_home, _homeZh, _away, _awayZh) => ({
    questionText: `Total corners: over or under 9?`,
    questionTextZh: `总角球数：大于还是小于9？`,
    options: ['Over 9', 'Under 9'],
    scoringMode: 'exact',
    type: 'fun',
  }),
  (home, homeZh, away, awayZh) => ({
    questionText: `Which team has a more famous football legend?`,
    questionTextZh: `哪支球队拥有更著名的足球传奇？`,
    options: [home, away],
    scoringMode: 'majority',
    type: 'fun',
  }),
];

export function getFallbackQuestions(
  homeTeam: string,
  homeTeamZh: string,
  awayTeam: string,
  awayTeamZh: string,
  count: number = 5
): FunQuestion[] {
  // Shuffle and pick `count` questions using match-specific seed
  const seed = (homeTeam + awayTeam).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...fallbackTemplates].sort(
    (a, b) => ((seed * 31 + fallbackTemplates.indexOf(a)) % 7) - ((seed * 31 + fallbackTemplates.indexOf(b)) % 7)
  );
  return shuffled.slice(0, count).map((fn) => fn(homeTeam, homeTeamZh, awayTeam, awayTeamZh));
}

export async function generateFunQuestions(
  homeTeam: string,
  homeTeamZh: string,
  awayTeam: string,
  awayTeamZh: string,
  count: number = 5,
  apiKey?: string
): Promise<FunQuestion[]> {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    console.warn('No ANTHROPIC_API_KEY set, using fallback questions');
    return getFallbackQuestions(homeTeam, homeTeamZh, awayTeam, awayTeamZh, count);
  }

  try {
    const client = new Anthropic({ apiKey: key });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} fun prediction questions for a FIFA World Cup match between ${homeTeam} and ${awayTeam}.

Rules:
- Mix of football-related questions (e.g. "Will there be a goal before halftime?") and culture/vibe questions (e.g. "Which country has better street food?")
- Aim for 2 football questions and ${count - 2} fun/culture questions
- Football questions should have a correct answer (scoring_mode: "exact"), options like "Yes"/"No" or specific choices
- Culture/vibe questions have no correct answer — the majority vote wins (scoring_mode: "majority"), options are typically the two team names
- Questions should be fun for both football fans AND people who don't follow football
- Each question needs English text AND Chinese translation

Return ONLY a JSON array with this exact format, no other text:
[
  {
    "questionText": "English question",
    "questionTextZh": "中文问题",
    "options": ["Option A", "Option B"],
    "scoringMode": "exact" or "majority",
    "type": "fun"
  }
]

Teams: ${homeTeam} (${homeTeamZh}) vs ${awayTeam} (${awayTeamZh})`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('Failed to parse Claude response, using fallback questions');
      return getFallbackQuestions(homeTeam, homeTeamZh, awayTeam, awayTeamZh, count);
    }

    const questions: FunQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate structure
    for (const q of questions) {
      if (!q.questionText || !q.questionTextZh || !Array.isArray(q.options) || q.options.length < 2) {
        console.warn('Invalid question format from Claude, using fallback');
        return getFallbackQuestions(homeTeam, homeTeamZh, awayTeam, awayTeamZh, count);
      }
      q.type = 'fun';
      if (!['exact', 'majority'].includes(q.scoringMode)) {
        q.scoringMode = 'majority';
      }
    }

    return questions.slice(0, count);
  } catch (error: any) {
    const message = error?.message || String(error);
    if (message.includes('401') || message.includes('authentication')) {
      console.warn('Claude API key is invalid, using fallback questions');
    } else if (message.includes('429') || message.includes('rate')) {
      console.warn('Claude API rate limit / quota exceeded, using fallback questions');
    } else {
      console.warn(`Claude API error: ${message}, using fallback questions`);
    }
    return getFallbackQuestions(homeTeam, homeTeamZh, awayTeam, awayTeamZh, count);
  }
}
