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
const AEM_GQL_ENDPOINT = 'https://author-p104103-e1884364.adobeaemcloud.com/graphql/execute.json/blog-store/blogpagelist';
const AEM_TOKEN = process.env.AEM_TOKEN || '';
const AEM_ORIGIN = 'https://main--akqaedsrc--rahul-chawla-akqa.aem.page';

function loadTemplate(templatePath) {
  const fullPath = path.join(__dirname, templatePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Minimal Mustache-style renderer supporting {{var}} and {{#arr}}...{{/arr}}
 */
function render(template, data) {
  let output = template;

  // Section blocks: {{#key}}...{{/key}}
  output = output.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, inner) => {
      const value = data[key];
      if (Array.isArray(value)) {
        return value.map((item) => render(inner, item)).join('');
      }
      if (value) return render(inner, data);
      return '';
    },
  );

  // Unescaped variable substitution: {{{key}}} (raw HTML)
  output = output.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined ? String(val) : '';
  });

  // Variable substitution: {{key}} (HTML-escaped)
  output = output.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    if (val === undefined) return '';
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

function transformBlogResponse(data) {
  const items = data?.data?.pageModelList?.items?.[0];
  if (!items) return [];
  const allBlogs = [];
  (items.main || []).forEach((section) => {
    (section.rows || []).forEach((row) => {
      (row.bloglist || []).forEach((blog) => {
        allBlogs.push({
          slug: blog._path.split('/').pop(),
          title: blog.title,
          description: blog.desc?.html || '',
          image: blog.asset?._path || '',
        });
      });
    });
  });
  return [...new Map(allBlogs.map((b) => [b.slug, b])).values()];
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

function buildBlogRows(blogs) {
  return blogs.map((blog) => `
        <div>
          <div>${blog.slug}</div>
          <div>${blog.title}</div>
          <div>${blog.description}</div>
          <div><img src="${blog.image}" alt="${blog.title}"/></div>
        </div>`).join('');
}

function injectRowsIntoBlock(html, rows) {
  const blockStart = html.indexOf('<div class="blogs">');
  if (blockStart === -1) return html;

  // Find the first child <div> (mode row) inside .blogs
  const contentStart = blockStart + '<div class="blogs">'.length;
  const firstChildStart = html.indexOf('<div>', contentStart);
  if (firstChildStart === -1) return html;

  // Walk through the mode row's nested divs to find its closing </div>
  let depth = 0;
  let i = firstChildStart;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i = html.indexOf('>', i) + 1;
    } else if (html.startsWith('</div>', i)) {
      depth -= 1;
      if (depth === 0) {
        const insertPos = i + '</div>'.length;
        return html.slice(0, insertPos) + rows + html.slice(insertPos);
      }
      i += '</div>'.length;
    } else {
      i += 1;
    }
  }

  return html;
}

async function fetchAuthoredPage(pathname) {
  const originURL = `${AEM_ORIGIN}${pathname}`;
  try {
    const resp = await fetch(originURL);
    if (resp.ok) return resp.text();
  } catch { /* origin unavailable, fall through to local drafts */ }

  // Fallback: read from local drafts folder
  const normalizedPath = pathname.replace(/\/$/, '') || '/index';
  const localFile = path.join(__dirname, 'drafts', `${normalizedPath}.plain.html`);
  if (fs.existsSync(localFile)) {
    return fs.readFileSync(localFile, 'utf-8');
  }
  // Try index.plain.html for directory paths
  const indexFile = path.join(__dirname, 'drafts', normalizedPath, 'index.plain.html');
  if (fs.existsSync(indexFile)) {
    return fs.readFileSync(indexFile, 'utf-8');
  }
  return null;
}

async function handleBlogsList() {
  const [pageHtml, data] = await Promise.all([
    fetchAuthoredPage('/blogs'),
    fetchJSON(AEM_GQL_ENDPOINT, getGqlHeaders()),
  ]);

  if (!pageHtml) return { status: 502, body: 'Error fetching authored blogs page' };
  if (!data) return { status: 502, body: 'Error fetching blogs from AEM CF' };

  const blogs = transformBlogResponse(data);
  const rows = buildBlogRows(blogs);
  const html = injectRowsIntoBlock(pageHtml, rows);
  return { status: 200, body: html };
}

async function handleBlogDetail(slug) {
  const [pageHtml, data] = await Promise.all([
    fetchAuthoredPage(`/blogs/${slug}`),
    fetchJSON(AEM_GQL_ENDPOINT, getGqlHeaders()),
  ]);

  if (!pageHtml) return { status: 502, body: 'Error fetching authored blog detail page' };
  if (!data) return { status: 502, body: 'Error fetching blog from AEM CF' };

  const blogs = transformBlogResponse(data);
  const blog = blogs.find((b) => b.slug === slug);
  if (!blog) return { status: 404, body: `Blog "${slug}" not found` };

  const rows = buildBlogRows([blog]);
  const html = injectRowsIntoBlock(pageHtml, rows);
  return { status: 200, body: html };
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
  } else if (pathname === '/blogs') {
    result = await handleBlogsList();
  } else if (pathname.match(/^\/blogs\/([a-z0-9-]+)$/i)) {
    const slug = pathname.match(/^\/blogs\/([a-z0-9-]+)$/i)[1];
    result = await handleBlogDetail(slug);
  } else {
    // Proxy all other requests to the AEM origin
    try {
      const originURL = `${AEM_ORIGIN}${req.url}`;
      const originResp = await fetch(originURL);
      const body = await originResp.text();
      const headers = { 'Content-Type': originResp.headers.get('content-type') || 'text/html' };
      res.writeHead(originResp.status, headers);
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
