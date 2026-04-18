import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import 'dotenv/config';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54392/postgres';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    parsed[key] = args[i + 1] || '';
  }
  return parsed;
}

async function main() {
  const { action, emails: emailsStr } = parseArgs();
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  switch (action) {
    case 'add-emails': {
      if (!emailsStr) {
        console.error('No emails provided. Use --emails "a@b.com,c@d.com"');
        process.exit(1);
      }
      const emails = emailsStr.split(',').map((e) => e.trim()).filter(Boolean);
      console.log(`Adding ${emails.length} emails to whitelist...`);
      for (const email of emails) {
        await db
          .insert(schema.allowedEmails)
          .values({ email: email.toLowerCase() })
          .onConflictDoNothing();
        console.log(`  + ${email}`);
      }
      console.log('Done.');
      break;
    }

    case 'remove-emails': {
      if (!emailsStr) {
        console.error('No emails provided. Use --emails "a@b.com,c@d.com"');
        process.exit(1);
      }
      const emails = emailsStr.split(',').map((e) => e.trim()).filter(Boolean);
      console.log(`Removing ${emails.length} emails from whitelist...`);
      for (const email of emails) {
        await db
          .delete(schema.allowedEmails)
          .where(eq(schema.allowedEmails.email, email.toLowerCase()));
        console.log(`  - ${email}`);
      }
      console.log('Done.');
      break;
    }

    case 'list-emails': {
      const all = await db.select().from(schema.allowedEmails);
      console.log(`Whitelisted emails (${all.length}):`);
      for (const row of all) {
        console.log(`  ${row.email} (added: ${row.createdAt.toISOString().slice(0, 10)})`);
      }
      break;
    }

    default:
      console.error(`Unknown action: ${action}. Use add-emails, remove-emails, or list-emails`);
      process.exit(1);
  }

  await client.end();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
