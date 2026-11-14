/**
 * Unit tests for filterHtml: event descriptions from the booking site arrive
 * as HTML and must read as plain text.
 */
import { filterHtml } from '../features/common/functions/filterHtml';

describe('filterHtml', () => {
  it('turns a list into bullet lines', () => {
    const html = 'Meny:\n<ul>\n  <li>Kycklingfilé</li>\n  <li>Rostade rotfrukter</li>\n</ul>\nVegetariskt finns.';
    expect(filterHtml(html)).toBe('Meny:\n• Kycklingfilé\n• Rostade rotfrukter\nVegetariskt finns.');
  });

  it('keeps paragraphs and line breaks', () => {
    expect(filterHtml('<p>Ett</p><p>Två<br>Tre</p>')).toBe('Ett\n\nTvå\nTre');
  });

  it('drops tags it does not know and keeps their text', () => {
    expect(filterHtml('<h3>Rubrik</h3><img src="x.png"><strong>Fet</strong> och <a href="mailto:a@b.se">länk</a>'))
      .toBe('Rubrik\n\nFet och länk');
  });

  it('decodes entities last, so escaped tags stay text', () => {
    expect(filterHtml('Fisk &amp; skaldjur, &lt;b&gt; är en tagg')).toBe('Fisk & skaldjur, <b> är en tagg');
  });

  it('leaves plain text as it is, apart from extra spaces', () => {
    expect(filterHtml('Hej  där\n\n\n\nVälkommen')).toBe('Hej där\n\nVälkommen');
  });
});
