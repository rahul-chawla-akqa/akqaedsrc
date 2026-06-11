import { fetchPlaceholders } from '../../scripts/placeholders.js';

export default function decorate(block) {
  /* eslint-disable-next-line no-console */
  console.log(block);
  document.addEventListener('delayed-phase', () => {
    /* eslint-disable-next-line no-console */
    console.log('delayed');
    fetchPlaceholders('nomodel').then((placeholders) => {
      /* eslint-disable-next-line no-console */
      console.log(placeholders);
    });
  });
}
