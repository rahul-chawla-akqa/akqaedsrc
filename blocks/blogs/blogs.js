function getBlogsBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const blogsIndex = segments.indexOf('blogs');
  return `/${segments.slice(0, blogsIndex + 1).join('/')}`;
}

function getMode(block) {
  const firstRow = block.querySelector(':scope > div > div');
  return firstRow?.textContent.trim() || 'list';
}

function getTextExcerpt(html, maxLength = 150) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.textContent || '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
}

function decorateList(block, rows) {
  const grid = document.createElement('div');
  grid.className = 'blogs-grid';
  const basePath = getBlogsBasePath();

  rows.forEach((row) => {
    const cells = [...row.children];
    const slug = cells[0]?.textContent.trim();
    const title = cells[1]?.textContent.trim();
    const descHtml = cells[2]?.innerHTML || '';
    const img = cells[3]?.querySelector('img');

    const card = document.createElement('a');
    card.className = 'blogs-card';
    card.href = `${basePath}/${slug}`;

    if (img) {
      const picture = document.createElement('div');
      picture.className = 'blogs-card-image';
      const clonedImg = img.cloneNode(true);
      clonedImg.loading = 'lazy';
      picture.append(clonedImg);
      card.append(picture);
    }

    const content = document.createElement('div');
    content.className = 'blogs-card-content';

    const h3 = document.createElement('h3');
    h3.textContent = title;

    const p = document.createElement('p');
    p.textContent = getTextExcerpt(descHtml);

    content.append(h3, p);
    card.append(content);
    grid.append(card);
  });

  block.textContent = '';
  block.append(grid);
}

function decorateDetail(block, rows) {
  const cells = [...(rows[0]?.children || [])];
  const title = cells[1]?.textContent.trim();
  const descHtml = cells[2]?.innerHTML || '';
  const img = cells[3]?.querySelector('img');

  const article = document.createElement('article');
  article.className = 'blogs-detail';

  const h2 = document.createElement('h2');
  h2.textContent = title;

  article.append(h2);

  if (img) {
    const figure = document.createElement('figure');
    figure.className = 'blogs-detail-image';
    const clonedImg = img.cloneNode(true);
    figure.append(clonedImg);
    article.append(figure);
  }

  const bodyEl = document.createElement('div');
  bodyEl.className = 'blogs-body';
  bodyEl.innerHTML = descHtml;

  const back = document.createElement('a');
  back.href = getBlogsBasePath();
  back.className = 'blogs-back button secondary';
  back.textContent = '\u2190 Back to all blogs';

  article.append(bodyEl, back);

  block.textContent = '';
  block.append(article);
}

/**
 * Decorates the blogs block with CF-sourced blog data.
 * Expects table-structure rows: [slug, title, description(HTML), image]
 * @param {Element} block The block element
 */
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
