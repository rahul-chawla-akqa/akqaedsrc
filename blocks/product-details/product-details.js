function getProductsBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const productsIndex = segments.indexOf('products');
  return `/${segments.slice(0, productsIndex + 1).join('/')}`;
}

function getMode(block) {
  const firstRow = block.querySelector(':scope > div > div');
  return firstRow?.textContent.trim() || 'list';
}

function decorateList(block, rows) {
  const grid = document.createElement('div');
  grid.className = 'product-details-grid';
  const basePath = getProductsBasePath();

  rows.forEach((row) => {
    const cells = [...row.children];
    const id = cells[0]?.textContent.trim();
    const title = cells[1]?.textContent.trim();
    const description = cells[2]?.textContent.trim() || '';

    const card = document.createElement('a');
    card.className = 'product-details-card';
    card.href = `${basePath}/${id}`;

    const h3 = document.createElement('h3');
    h3.textContent = title;

    const p = document.createElement('p');
    p.textContent = description.length > 120 ? `${description.substring(0, 120)}…` : description;

    card.append(h3, p);
    grid.append(card);
  });

  block.textContent = '';
  block.append(grid);
}

function decorateDetail(block, rows) {
  const infoRow = rows[0] ? [...rows[0].children] : [];
  const priceRow = rows[1] ? [...rows[1].children] : [];
  const brandRow = rows[2] ? [...rows[2].children] : [];
  const skuRow = rows[3] ? [...rows[3].children] : [];
  const shippingRow = rows[4] ? [...rows[4].children] : [];

  const article = document.createElement('article');
  article.className = 'product-details-detail';

  const h2 = document.createElement('h2');
  h2.textContent = infoRow[1]?.textContent.trim() || '';

  const description = document.createElement('p');
  description.className = 'product-details-description';
  description.textContent = infoRow[2]?.textContent.trim() || '';

  const priceContainer = document.createElement('div');
  priceContainer.className = 'product-details-pricing';

  const price = document.createElement('span');
  price.className = 'product-details-price';
  price.textContent = `$${priceRow[0]?.textContent.trim() || ''}`;

  const discount = document.createElement('span');
  discount.className = 'product-details-discount';
  const discountVal = priceRow[1]?.textContent.trim();
  if (discountVal) discount.textContent = `${discountVal}% off`;

  const rating = document.createElement('span');
  rating.className = 'product-details-rating';
  rating.textContent = `★ ${priceRow[2]?.textContent.trim() || ''}`;

  priceContainer.append(price, discount, rating);

  const meta = document.createElement('dl');
  meta.className = 'product-details-meta';

  const fields = [
    ['Brand', brandRow[0]],
    ['Category', brandRow[1]],
    ['Availability', brandRow[2]],
    ['SKU', skuRow[0]],
    ['Stock', skuRow[1]],
    ['Warranty', skuRow[2]],
    ['Shipping', shippingRow[0]],
  ];

  fields.forEach(([label, cell]) => {
    const val = cell?.textContent.trim();
    if (!val) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = val;
    meta.append(dt, dd);
  });

  const thumbnail = shippingRow[1]?.textContent.trim();
  let img;
  if (thumbnail) {
    img = document.createElement('img');
    img.src = thumbnail;
    img.alt = infoRow[1]?.textContent.trim() || 'Product image';
    img.loading = 'lazy';
    img.className = 'product-details-image';
  }

  const back = document.createElement('a');
  back.href = getProductsBasePath();
  back.className = 'product-details-back button secondary';
  back.textContent = '\u2190 Back to all products';

  article.append(h2, description, priceContainer, meta);
  if (img) article.append(img);
  article.append(back);

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
