function getPostsBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const postsIndex = segments.indexOf('posts');
  return `/${segments.slice(0, postsIndex + 1).join('/')}`;
}

function getMode(block) {
  const firstRow = block.querySelector(':scope > div > div');
  return firstRow?.textContent.trim() || 'list';
}

function decorateList(block, rows) {
  const grid = document.createElement('div');
  grid.className = 'posts-grid';
  const basePath = getPostsBasePath();

  rows.forEach((row) => {
    const cells = [...row.children];
    const id = cells[0]?.textContent.trim();
    const title = cells[1]?.textContent.trim();
    const body = cells[2]?.textContent.trim() || '';

    const card = document.createElement('a');
    card.className = 'posts-card';
    card.href = `${basePath}/${id}`;

    const h3 = document.createElement('h3');
    h3.textContent = title;

    const p = document.createElement('p');
    p.textContent = body.length > 120 ? `${body.substring(0, 120)}…` : body;

    card.append(h3, p);
    grid.append(card);
  });

  block.textContent = '';
  block.append(grid);
}

function decorateDetail(block, rows) {
  const cells = [...(rows[0]?.children || [])];
  const id = cells[0]?.textContent.trim();
  const title = cells[1]?.textContent.trim();
  const body = cells[2]?.textContent.trim() || '';

  const article = document.createElement('article');
  article.className = 'posts-detail';

  const h2 = document.createElement('h2');
  h2.textContent = title;

  const meta = document.createElement('p');
  meta.className = 'posts-meta';
  meta.textContent = `Post #${id}`;

  const bodyEl = document.createElement('p');
  bodyEl.className = 'posts-body';
  bodyEl.textContent = body;

  const back = document.createElement('a');
  back.href = getPostsBasePath();
  back.className = 'posts-back button secondary';
  back.textContent = '\u2190 Back to all posts';

  article.append(h2, meta, bodyEl, back);

  block.textContent = '';
  block.append(article);
}

export default async function decorate(block) {
  const allRows = [...block.querySelectorAll(':scope > div')];
  if (allRows.length === 0) return;

  const mode = getMode(block);
  const dataRows = allRows.slice(1);

  if (mode === 'detail') {
    decorateDetail(block, dataRows);
  } else {
    decorateList(block, dataRows);
  }
}
