function parseKeyValueRows(block) {
  const map = {};
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const [keyCell, valueCell] = cells;
      const key = keyCell?.textContent.trim();
      if (key) map[key] = valueCell;
    }
  });
  return map;
}

function parseProductFromList(li) {
  const product = {};
  li.querySelectorAll(':scope > ul > li').forEach((item) => {
    const strong = item.querySelector('strong');
    if (!strong) return;
    const key = strong.textContent.replace(/:$/, '').trim();
    const value = item.textContent.replace(strong.textContent, '').trim();
    if (key && value) product[key] = value;
  });
  return product;
}

function getProductsBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const productsIndex = segments.indexOf('products');
  if (productsIndex === -1) return '/products';
  return `/${segments.slice(0, productsIndex + 1).join('/')}`;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') node.className = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => {
    if (typeof c === 'string') node.textContent = c;
    else if (c) node.append(c);
  });
  return node;
}

function buildProductList(productsCell) {
  const items = productsCell.querySelectorAll(':scope > ul > li');
  const basePath = getProductsBasePath();

  const grid = el('div', { className: 'data-grid' });

  items.forEach((li) => {
    const product = parseProductFromList(li);
    if (!product.id || !product.title) return;

    const card = document.createElement('a');
    card.className = 'data-card';
    card.href = `${basePath}/${product.id}`;

    card.append(el('h3', {}, product.title));

    if (product.description) {
      const desc = product.description.length > 120
        ? `${product.description.substring(0, 120)}…`
        : product.description;
      card.append(el('p', { className: 'data-card-desc' }, desc));
    }

    const meta = el('div', { className: 'data-card-meta' });
    if (product.price) meta.append(el('span', { className: 'data-price' }, `$${product.price}`));
    if (product.rating) meta.append(el('span', { className: 'data-rating' }, `★ ${product.rating}`));
    if (product.brand) meta.append(el('span', { className: 'data-card-brand' }, product.brand));
    if (meta.children.length) card.append(meta);

    grid.append(card);
  });

  return grid;
}

function buildProductDetail(fields) {
  const article = el('article', { className: 'data-detail' });

  const title = fields.title?.textContent.trim() || '';
  article.append(el('h2', {}, title));

  const desc = fields.description?.textContent.trim() || '';
  if (desc) article.append(el('p', { className: 'data-description' }, desc));

  const pricing = el('div', { className: 'data-pricing' });
  const price = fields.price?.textContent.trim();
  if (price) pricing.append(el('span', { className: 'data-price' }, `$${price}`));
  const discount = fields.discountPercentage?.textContent.trim();
  if (discount) pricing.append(el('span', { className: 'data-discount' }, `${discount}% off`));
  const rating = fields.rating?.textContent.trim();
  if (rating) pricing.append(el('span', { className: 'data-rating' }, `★ ${rating}`));
  if (pricing.children.length) article.append(pricing);

  const thumbnailUrl = fields.thumbnail?.textContent.trim();
  if (thumbnailUrl) {
    const img = el('img', {
      src: thumbnailUrl,
      alt: title || 'Product image',
      loading: 'lazy',
      className: 'data-image',
    });
    article.append(img);
  }

  const meta = el('dl', { className: 'data-meta' });
  const metaFields = [
    ['Brand', fields.brand],
    ['Category', fields.category],
    ['Availability', fields.availabilityStatus],
    ['SKU', fields.sku],
    ['Stock', fields.stock],
    ['Warranty', fields.warrantyInformation],
    ['Shipping', fields.shippingInformation],
    ['Return Policy', fields.returnPolicy],
    ['Min. Order Qty', fields.minimumOrderQuantity],
    ['Weight', fields.weight],
  ];
  metaFields.forEach(([label, cell]) => {
    const val = cell?.textContent.trim();
    if (!val) return;
    meta.append(el('dt', {}, label));
    meta.append(el('dd', {}, val));
  });
  if (meta.children.length) article.append(meta);

  article.append(el('a', {
    href: getProductsBasePath(),
    className: 'data-back button secondary',
  }, '\u2190 Back to all products'));

  return article;
}

export default async function decorate(block) {
  const fields = parseKeyValueRows(block);
  if (!Object.keys(fields).length) return;

  // List mode: "products" key with nested <ul> of items
  if (fields.products && fields.products.querySelector('ul')) {
    const grid = buildProductList(fields.products);
    block.textContent = '';
    block.append(grid);
    return;
  }

  // Detail mode: individual key-value pairs
  const article = buildProductDetail(fields);
  block.textContent = '';
  block.append(article);
}
