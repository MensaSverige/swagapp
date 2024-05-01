export const extractLinks = (html: string) => {
    const linkRegex = /<a href="(.*?)">(.*?)<\/a>/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        let name = match[2];
        if (!name.startsWith('http')) {
            name = name.replace(/en\s/g, '');
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }
        links.push({ url: match[1], name: name });
    }
    return links;
};