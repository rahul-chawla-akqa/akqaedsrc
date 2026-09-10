import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the blogs block.
 *
 * Authoring: the block stores a Content Fragment path via the
 * aem-content-fragment picker; Universal Editor persists field edits
 * back to the CF at /content/dam/akqaedsrc/blogs/*.
 *
 * Delivery: the edge function resolves that CF into rows before this runs:
 *   [title], [description (richtext)], [image]
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const titleCell = rows[0]?.querySelector(':scope > div');
  const descCell = rows[1]?.querySelector(':scope > div');
  const imageCell = rows[2]?.querySelector(':scope > div');

  const article = document.createElement('article');
  article.className = 'blogs-article';
  moveInstrumentation(block, article);

  const titleText = titleCell?.textContent.trim();
  if (titleText) {
    const h2 = document.createElement('h2');
    h2.className = 'blogs-title';
    h2.textContent = titleText;
    article.append(h2);
  }

  const img = imageCell?.querySelector('img');
  if (img) {
    const figure = document.createElement('figure');
    figure.className = 'blogs-image';
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    figure.append(optimizedPic);
    article.append(figure);
  }

  const descHtml = descCell?.innerHTML.trim();
  if (descHtml) {
    const body = document.createElement('div');
    body.className = 'blogs-body';
    body.innerHTML = descHtml;
    article.append(body);
  }

  block.replaceChildren(article);
}
