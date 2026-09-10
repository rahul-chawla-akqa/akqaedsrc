import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local if present
const envFile = path.join(__dirname, '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf-8').split('\n').forEach((line) => {
    const match = line.match(/^(\w+)\s*=\s*"?(.+?)"?\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  });
}

const PORT = 4000;
const API_BASE = 'https://jsonplaceholder.typicode.com';
const AEM_CF_ASSETS_BASE = 'https://author-p104103-e1884364.adobeaemcloud.com/api/assets/akqaedsrc/blogs';
const AEM_TOKEN = process.env.AEM_TOKEN || '';
const AEM_ORIGIN = 'https://main--akqaedsrc--rahul-chawla-akqa.aem.page';

function loadTemplate(templatePath) {
  const fullPath = path.join(__dirname, templatePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Minimal Mustache-style renderer supporting {{var}} and {{#arr}}...{{/arr}}
 */
function getByPath(data, key) {
  if (!key.includes('.')) return data[key];
  return key.split('.').reduce((acc, part) => (
    acc !== undefined && acc !== null ? acc[part] : undefined
  ), data);
}

function render(template, data) {
  let output = template;

  // Section blocks: {{#key}}...{{/key}}
  output = output.replace(
    /\{\{#([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, inner) => {
      const value = getByPath(data, key);
      if (Array.isArray(value)) {
        return value.map((item) => render(inner, item)).join('');
      }
      if (value) return render(inner, data);
      return '';
    },
  );

  // Unescaped variable substitution: {{{key}}} (raw HTML)
  output = output.replace(/\{\{\{([\w.]+)\}\}\}/g, (_, key) => {
    const val = getByPath(data, key);
    return val !== undefined && val !== null ? String(val) : '';
  });

  // Variable substitution: {{key}} (HTML-escaped)
  output = output.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const val = getByPath(data, key);
    if (val === undefined || val === null) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  });

  return output;
}

async function fetchJSON(url, headers = {}) {
  const resp = await fetch(url, { headers });
  if (!resp.ok) return null;
  return resp.json();
}

async function handleBlogDetail(slug) {
  const data = await fetchJSON(`${AEM_CF_ASSETS_BASE}/${slug}.json`, getGqlHeaders());
  if (!data) return { status: 404, body: `Blog "${slug}" not found` };

  const template = loadTemplate('cf-templates/blogs.html');
  const html = render(template, data);
  return { status: 200, body: html };
}

async function handlePostsList() {
  const posts = await fetchJSON(`${API_BASE}/posts`);
  if (!posts) return { status: 502, body: 'Error fetching posts' };

  const template = loadTemplate('templates/posts/list.html');
  const html = render(template, { posts });
  return { status: 200, body: html };
}

async function handlePostDetail(id) {
  const post = await fetchJSON(`${API_BASE}/posts/${id}`);
  if (!post) return { status: 404, body: `Post ${id} not found` };

  const template = loadTemplate('templates/posts/detail.html');
  const html = render(template, post);
  return { status: 200, body: html };
}

function getGqlHeaders() {
  const headers = {};
  if (AEM_TOKEN) headers.Authorization = `Bearer ${AEM_TOKEN}`;
  return headers;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  let result;

  if (pathname === '/posts') {
    result = await handlePostsList();
  } else if (pathname.match(/^\/posts\/(\d+)$/)) {
    const id = pathname.match(/^\/posts\/(\d+)$/)[1];
    result = await handlePostDetail(id);
  } else if (pathname.match(/^\/blogs\/([a-z0-9-]+)$/i)) {
    const slug = pathname.match(/^\/blogs\/([a-z0-9-]+)$/i)[1];
    result = await handleBlogDetail(slug);
  } else {
    // Proxy all other requests to the AEM origin
    try {
      const originURL = `${AEM_ORIGIN}${req.url}`;
      const originResp = await fetch(originURL);
      let body = await originResp.text();
      const contentType = originResp.headers.get('content-type') || 'text/html';

      res.writeHead(originResp.status, { 'Content-Type': contentType });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${e.message}`);
    }
    return;
  }

  res.writeHead(result.status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(result.body);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Posts SSR dev proxy running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`  /posts routes → jsonplaceholder API (SSR)`);
  // eslint-disable-next-line no-console
  console.log(`  All other routes → ${AEM_ORIGIN}`);
  // eslint-disable-next-line no-console
  console.log('\nNow run: aem up --url http://localhost:4000');
});
