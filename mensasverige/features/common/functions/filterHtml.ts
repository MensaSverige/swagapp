export function filterHtml(htmlString: string) {
    let previousHtml;
    do {
        previousHtml = htmlString;
        htmlString = htmlString
            .replace(/<div.*?>([\s\S]*?)<\/div>/g, '$1\n') // handle div tags with or without classes
            .replace(/<span.*?>([\s\S]*?)<\/span>/g, '$1') // handle  <span> tags with or without classes
            .replace(/<p.*?>([\s\S]*?)<\/p>/g, '$1\n')  // handle <p> tags with or without classes
            .replace(/<b.*?>([\s\S]*?)<\/b>/g, '$1')  // handle <b> tags with or without classes
            .replace(/<strong.*?>([\s\S]*?)<\/strong>/g, '$1')  //  handle <strong> tags with or without classes
            .replace(/<em.*?>([\s\S]*?)<\/em>/g, '$1')  // handle <em> tags with or without classes
            .replace(/<i.*?>([\s\S]*?)<\/i>/g, '$1')  //  handle <i> tags with or without classes
            .replace(/<u.*?>([\s\S]*?)<\/u>/g, '$1')  // handle <u> tags with or without classes
            .replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '$2')  // handle <a> tags with or without classes
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