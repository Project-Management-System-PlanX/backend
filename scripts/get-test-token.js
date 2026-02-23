#!/usr/bin/env node
/**
 * get-test-token.js
 * ──────────────────
 * Generates a Clerk testing token for backend testing WITHOUT a frontend.
 * Uses Clerk's official Testing Tokens API.
 *
 * Usage:
 *   node scripts/get-test-token.js
 *   node scripts/get-test-token.js --curl   # prints ready-to-use curl commands
 *
 * Docs: https://clerk.com/docs/testing/testing-tokens
 */

require('dotenv').config({ path: '.env' });

const https = require('https');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const BASE_URL = process.env.PORT
    ? `http://localhost:${process.env.PORT}`
    : 'http://localhost:3002';

if (!CLERK_SECRET_KEY) {
    console.error('❌  CLERK_SECRET_KEY not found in .env');
    process.exit(1);
}

function fetchTestingToken() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.clerk.com',
            path: '/v1/testing_tokens',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const showCurl = process.argv.includes('--curl');

    console.log('🔑  Requesting Clerk testing token...\n');

    const result = await fetchTestingToken();

    if (!result.token) {
        console.error('❌  Failed to get token:', result);
        process.exit(1);
    }

    const expiresAt = new Date(result.expires_at * 1000).toLocaleTimeString();
    const token = result.token;

    console.log('✅  Token generated successfully!\n');
    console.log(`🕐  Expires at: ${expiresAt}`);
    console.log(`\n${'─'.repeat(60)}`);
    console.log('TOKEN:');
    console.log(token);
    console.log(`${'─'.repeat(60)}\n`);

    if (showCurl) {
        console.log('📋  Ready-to-use curl commands:\n');
        console.log(`export TOKEN="${token}"\n`);

        const cmds = [
            ['List my workspaces', `curl -H "Authorization: Bearer $TOKEN" ${BASE_URL}/workspaces`],
            [
                'Create a workspace',
                `curl -X POST ${BASE_URL}/workspaces \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Team", "slug": "my-team"}'`,
            ],
            [
                'Create a channel (replace <workspace-id>)',
                `curl -X POST ${BASE_URL}/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"workspaceId": "<workspace-id>", "name": "general", "type": "PUBLIC"}'`,
            ],
            [
                'List workspace members (replace <workspace-id>)',
                `curl -H "Authorization: Bearer $TOKEN" ${BASE_URL}/workspaces/<workspace-id>/members`,
            ],
        ];

        for (const [label, cmd] of cmds) {
            console.log(`# ${label}`);
            console.log(cmd);
            console.log('');
        }
    } else {
        console.log('💡  Tip: run with --curl flag to see ready-to-use curl commands');
        console.log(`    node scripts/get-test-token.js --curl\n`);
        console.log('💡  Or use the token directly:');
        console.log(`    export TOKEN="${token}"`);
        console.log(`    curl -H "Authorization: Bearer $TOKEN" ${BASE_URL}/workspaces\n`);
    }
}

main().catch((err) => {
    console.error('❌  Error:', err.message);
    process.exit(1);
});
