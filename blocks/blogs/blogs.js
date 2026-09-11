import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the blogs block.
 *
 * Content source: an AEM "Blogs" Content Fragment. At publish time the
 * json2html overlay renders the CF into this block's rows via
 * cf-templates/blogs.html (SSG), so the fields arrive as static HTML:
 *   [title], [description (richtext)], [image]
 *
 * Authoring: Universal Editor edits the CF fields and persists them
 * back to the Content Fragment (see the xwalk.cf plugin in _blogs.json).
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
