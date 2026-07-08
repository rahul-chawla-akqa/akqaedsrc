/// <reference types="@fastly/js-compute" />

const API_BACKEND = 'jsonplaceholder';

function htmlPage(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="title" content="${title}">
</head>
<body>
  <header></header>
  <main>
    <div>
      <h1>${title}</h1>
      <div class="posts">
        ${bodyContent}
      </div>
    </div>
  </main>
  <footer></footer>
</body>
</html>`;
}

function renderPostRow(post) {
  return `<div>
  <div>${post.id}</div>
  <div>${post.title}</div>
  <div>${post.body}</div>
</div>`;
}

async function postsListHandler() {
  const req = new Request('https://jsonplaceholder.typicode.com/posts');
  const resp = await fetch(req, { backend: API_BACKEND });

  if (resp.status !== 200) {
    return new Response('Error fetching posts', { status: 502 });
  }

  const posts = await resp.json();
  const rows = posts.map((post) => renderPostRow(post)).join('\n');

  const bodyContent = `<div>
  <div>list</div>
</div>
${rows}`;

  const html = htmlPage('Posts', bodyContent);
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function postDetailHandler(id) {
  const req = new Request(`https://jsonplaceholder.typicode.com/posts/${id}`);
  const resp = await fetch(req, { backend: API_BACKEND });

  if (resp.status !== 200) {
    return new Response(`Post ${id} not found`, { status: 404 });
  }

  const post = await resp.json();
  const row = renderPostRow(post);

  const bodyContent = `<div>
  <div>detail</div>
</div>
${row}`;

  const html = htmlPage(`Post: ${post.title}`, bodyContent);
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export { postsListHandler, postDetailHandler };
