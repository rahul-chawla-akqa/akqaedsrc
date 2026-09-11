/**
 * AEM Edge Function for /posts routes.
 *
 * Fetches from the jsonplaceholder API and injects block markup at the edge.
 *
 * NOTE: Blogs are NOT handled here. Blog Content Fragments are rendered as
 * static pages via the json2html content-fragment overlay (SSG) using
 * cf-templates/blogs.html — see JSON2HTML-SETUP.md.
 */

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

  return context.next();
}
