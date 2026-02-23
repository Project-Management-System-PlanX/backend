#!/usr/bin/env node
/**
 * serve-test-auth.js
 * Serves the test-auth.html page on http://localhost:9999
 * Run: node scripts/serve-test-auth.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9999;
const htmlPath = path.join(__dirname, 'test-auth.html');

const server = http.createServer((req, res) => {
    // Serve the HTML for ALL GET requests — Clerk may redirect to paths like
    // /?__clerk_status=... or /sso-callback, etc. We handle them all here.
    if (req.method === 'GET') {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } else {
        res.writeHead(405);
        res.end('Method Not Allowed');
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌  Port ${PORT} is already in use.`);
        console.error(`   Run this to free it:\n`);
        console.error(`   kill $(lsof -ti:${PORT})\n`);
        console.error(`   Then re-run: npm run test:token\n`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log('');
    console.log('🔑  Bearer Token Test Tool');
    console.log('──────────────────────────────────');
    console.log(`✅  Open this URL in your browser:`);
    console.log(`   👉  http://localhost:${PORT}`);
    console.log('');
    console.log('   Sign in with Google / GitHub / Email');
    console.log('   Copy your Bearer token from the page');
    console.log('   Use it in the curl commands shown');
    console.log('──────────────────────────────────');
    console.log('   Press Ctrl+C to stop');
    console.log('');
});
