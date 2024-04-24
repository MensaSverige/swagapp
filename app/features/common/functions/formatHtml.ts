export function parseHTML(htmlString: string) {
    // Replace HTML tags with corresponding React Native components
    const replacedText = htmlString
        .replace(/<b>(.*?)<\/b>/g, '$1')  // handle <b> tags
        .replace(/<strong>(.*?)<\/strong>/g, '$1')  // handle <strong> tags
        .replace(/<em>(.*?)<\/em>/g, '$1')  // handle <em> tags
        .replace(/&amp;/g, '&');  // handle &amp; entities
    return replacedText;
}