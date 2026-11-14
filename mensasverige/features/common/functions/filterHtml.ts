/**
 * Plain text for an event description that may hold HTML, as the booking
 * site's descriptions do.
 *
 * Paragraphs and line breaks are kept, list items become "• " lines, and any
 * other tag is dropped rather than shown. Entities are decoded last, so text
 * that only looks like a tag once decoded ("&lt;b&gt;") stays text.
 */
export function filterHtml(html: string): string {
    const text = html
        .replace(/\r\n?/g, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        // Lists: one "• " line per item, without the blank lines the source
        // indentation would leave.
        .replace(/\s*<\/?(ul|ol)(\s[^>]*)?>\s*/gi, '\n')
        .replace(/<\/li\s*>/gi, '')
        .replace(/\s*<li(\s[^>]*)?>\s*/gi, '\n• ')
        // Blocks end in a blank line, as paragraphs do.
        .replace(/<\/(p|div|h[1-6]|blockquote|tr)\s*>/gi, '\n\n')
        // Any other tag, opening or closing, goes; its text stays.
        .replace(/<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/gi, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&(apos|#39);/g, "'")
        .replace(/&(ndash|#8211);/g, '–')
        .replace(/&(mdash|#8212);/g, '—')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

    return text
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
