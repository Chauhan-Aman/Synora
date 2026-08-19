const cheerio = require('cheerio');
fetch('https://www.bing.com/search?q=who+is+Imran+Hasmi', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}).then(r => r.text()).then(t => {
  const $ = cheerio.load(t);
  const searchResults = [];
  $('li.b_algo h2 a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('u=a1')) {
      const b64 = href.split('u=a1')[1].split('&')[0];
      try {
        const realUrl = Buffer.from(b64, 'base64').toString('utf8');
        searchResults.push({ url: realUrl, title: $(el).text() });
      } catch(e) {}
    } else if (href && href.startsWith('http')) {
      searchResults.push({ url: href, title: $(el).text() });
    }
  });
  console.log(searchResults);
});
