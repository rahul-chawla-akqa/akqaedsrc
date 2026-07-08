/**
 * AEM Edge Function for /posts and /blogs routes.
 *
 * For /posts: Fetches from jsonplaceholder API and injects block markup.
 * For /blogs: Fetches authored page from origin, then injects CF data
 * into the .blogs block (ESI-style server-side injection).
 */

const AEM_GQL_ENDPOINT = 'https://publish-p104103-e1884364.adobeaemcloud.com/graphql/execute.json/blog-store/blogpagelist';

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

  const contentStart = blockStart + '<div class="blogs">'.length;
  const firstChildStart = html.indexOf('<div>', contentStart);
  if (firstChildStart === -1) return html;

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

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

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

    return new Response(modifiedHtml, {
      headers: originResponse.headers,
    });
  }

  if (pathname === '/blogs' || pathname.match(/^\/blogs\/[a-z0-9-]+$/i)) {
    const [originResponse, apiResponse] = await Promise.all([
      context.next(),
      fetch(AEM_GQL_ENDPOINT),
    ]);

    const originalHtml = await originResponse.text();
    const data = await apiResponse.json();
    const blogs = transformBlogResponse(data);

    const slug = pathname.match(/^\/blogs\/([a-z0-9-]+)$/i)?.[1];
    const targetBlogs = slug ? blogs.filter((b) => b.slug === slug) : blogs;

    if (slug && targetBlogs.length === 0) {
      return new Response(`Blog "${slug}" not found`, { status: 404 });
    }

    const rows = buildBlogRows(targetBlogs);
    const modifiedHtml = injectRowsIntoBlock(originalHtml, rows);

    return new Response(modifiedHtml, {
      headers: originResponse.headers,
    });
  }

  return context.next();
}
