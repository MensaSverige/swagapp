export function parseHTML(htmlString: string) {
    let previousHtml;
    do {
        previousHtml = htmlString;
        htmlString = htmlString
            .replace(/<div.*?>([\s\S]*?)<\/div>/g, '$1\n') // remove <div> tags with or without classes
            .replace(/<span.*?>([\s\S]*?)<\/span>/g, '$1') // remove <span> tags with or without classes
            .replace(/<p>([\s\S]*?)<\/p>/g, '$1\n')  // handle <p> tags
            .replace(/<b>([\s\S]*?)<\/b>/g, '$1')  // handle <b> tags
            .replace(/<strong>([\s\S]*?)<\/strong>/g, '$1')  // handle <strong> tags
            .replace(/<em>([\s\S]*?)<\/em>/g, '$1')  // handle <em> tags
            .replace(/<i>([\s\S]*?)<\/i>/g, '$1')  // handle <i> tags
            .replace(/<u>([\s\S]*?)<\/u>/g, '$1')  // handle <u> tags
            .replace(/<a href="(.*?)">(.*?)<\/a>/g, '$2')  // handle <a> tags
            .replace(/<br>/g, '\n')  // handle <br> tags
            .replace(/&nbsp;/g, ' ')  // handle &nbsp; entities
            .replace(/&lt;/g, '<')  // handle &lt; entities
            .replace(/&gt;/g, '>')  // handle &gt; entities
            .replace(/&quot;/g, '"')  // handle &quot; entities
            .replace(/&apos;/g, "'")  // handle &apos; entities
            .replace(/&#8211;/g, '–')  // handle – entities
            .replace(/&amp;/g, '&');  // handle &amp; entities
    } while (htmlString !== previousHtml);
    return htmlString;
}