/**
 * AEM Edge Function for /posts routes and .blogs blocks.
 *
 * For /posts: Fetches from jsonplaceholder API and injects block markup.
 * For .blogs: The block on the page stores a Content Fragment path (authored
 * via the aem-content-fragment picker in Universal Editor, which persists
 * edits back to the CF). This function resolves that path to the CF's fields
 * and injects title/description/image into the block (SSR at edge).
 */

// AEM publish host used to resolve Content Fragment content by path.
const AEM_PUBLISH_HOST = 'https://publish-p104103-e1884364.adobeaemcloud.com';

/**
 * Extracts the CF path from a .blogs block's raw markup.
 * The picker stores the fragment path as text or a link.
 */
function extractCfPath(blockHtml) {
  const linkMatch = blockHtml.match(/href="([^"]*\/content\/dam\/[^"]+)"/);
  if (linkMatch) return linkMatch[1];
  const pathMatch = blockHtml.match(/(\/content\/dam\/[^\s"<]+)/);
  return pathMatch ? pathMatch[1] : null;
}

/**
 * Fetches a Content Fragment by path using the AEM Assets Delivery API.
 */
async function fetchCfByPath(cfPath) {
  const apiPath = cfPath.replace(/^\/content\/dam\//, '');
  const url = `${AEM_PUBLISH_HOST}/api/assets/${apiPath}.json`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) return null;
  return resp.json();
}

/**
 * Normalizes CF Assets API JSON into { title, description, image }.
 */
function normalizeCf(data) {
  const el = data?.properties?.elements || data?.elements || {};
  const title = el.title?.value || data?.properties?.title || '';
  const description = el.description?.value?.html
    || el.description?.value
    || '';
  let image = el.imageReference?.value || '';
  if (image && image.startsWith('/content/dam/')) {
    image = `${AEM_PUBLISH_HOST}${image}`;
  }
  return { title, description, image };
}

/**
 * Builds the block rows expected by blocks/blogs/blogs.js:
 * [title], [description], [image]
 */
function buildBlogRows({ title, description, image }) {
  const imageCell = image
    ? `<picture><img src="${image}" alt="${title}"></picture>`
    : '';
  return `
        <div><div>${title}</div></div>
        <div><div>${description}</div></div>
        <div><div>${imageCell}</div></div>`;
}

/**
 * Replaces the inner content of the first .blogs block with resolved rows.
 */
function injectBlogRows(html, rows) {
  const marker = '<div class="blogs">';
  const start = html.indexOf(marker);
  if (start === -1) return html;

  const contentStart = start + marker.length;

  // walk balanced <div> tags to find the block's closing </div>
  let depth = 1;
  let i = contentStart;
  while (i < html.length && depth > 0) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i = html.indexOf('>', i) + 1;
    } else if (html.startsWith('</div>', i)) {
      depth -= 1;
      if (depth === 0) break;
      i += '</div>'.length;
    } else {
      i += 1;
    }
  }

  return html.slice(0, contentStart) + rows + html.slice(i);
}

async function handleBlogs(html, originResponse) {
  const marker = '<div class="blogs">';
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const blockHtml = html.slice(start, start + 2000);
  const cfPath = extractCfPath(blockHtml);
  if (!cfPath) return null;

  const data = await fetchCfByPath(cfPath);
  if (!data) return null;

  const rows = buildBlogRows(normalizeCf(data));
  const modifiedHtml = injectBlogRows(html, rows);

  return new Response(modifiedHtml, { headers: originResponse.headers });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  // /posts — jsonplaceholder demo
  if (pathname === '/posts' || pathname.match(/^\/posts\/\d+$/)) {
    const apiResponse = await fetch('https://jsonplaceholder.typicode.com/posts');
    const posts = await apiResponse.json();

    let blockMarkup = '<div class="posts-wrapper">';
    blockMarkup += '<div class="posts block" data-block-name="posts">';

    posts.forEach((post) => {
      blockMarkup += `
        <div>
          <div><strong>${post.title}</strong></div>
          <div>${post.body}</div>
        </div>
      `;
    });

    blockMarkup += '</div></div>';

    const originResponse = await context.next();
    const originalHtml = await originResponse.text();
    const modifiedHtml = originalHtml.replace('<main>', `<main>${blockMarkup}`);

    return new Response(modifiedHtml, { headers: originResponse.headers });
  }

  // Any page with a .blogs block — resolve the CF and inject its content
  const originResponse = await context.next();
  const contentType = originResponse.headers.get('content-type') || '';
  if (!contentType.includes('html')) return originResponse;

  const html = await originResponse.text();
  if (html.includes('<div class="blogs">')) {
    try {
      const blogsResponse = await handleBlogs(html, originResponse);
      if (blogsResponse) return blogsResponse;
    } catch {
      // fall through to original HTML on failure
    }
  }

  return new Response(html, { headers: originResponse.headers });
}
