import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the blogs block.
 * Block fields come from a Blogs Content Fragment (title, description, imageReference).
 * Rows: [title], [description (richtext)], [imageReference]
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const article = document.createElement('article');
  article.className = 'blogs-article';
  moveInstrumentation(block, article);

  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic) {
        const figure = document.createElement('figure');
        figure.className = 'blogs-image';
        moveInstrumentation(cell, figure);
        const img = pic.querySelector('img');
        if (img) {
          const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
          moveInstrumentation(img, optimizedPic.querySelector('img'));
          figure.append(optimizedPic);
        } else {
          figure.append(pic);
        }
        article.append(figure);
      } else if (cell.querySelector('h1, h2, h3, h4, h5, h6') || cell.childElementCount === 0) {
        const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          moveInstrumentation(cell, heading);
          article.append(heading);
        } else if (cell.textContent.trim()) {
          const h2 = document.createElement('h2');
          h2.className = 'blogs-title';
          h2.textContent = cell.textContent.trim();
          moveInstrumentation(cell, h2);
          article.append(h2);
        }
      } else {
        const body = document.createElement('div');
        body.className = 'blogs-body';
        moveInstrumentation(cell, body);
        while (cell.firstChild) body.append(cell.firstChild);
        article.append(body);
      }
    });
  });

  block.replaceChildren(article);
}
