import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  snippet: string;
}

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);

  private static readonly DDG_ENDPOINT = 'https://lite.duckduckgo.com/lite/';
  private static readonly BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  async search(
    query: string,
    limit = 3,
    maxRetries = 2,
  ): Promise<WebSearchResult[]> {
    const links = await this.fetchSearchLinks(query, maxRetries);
    if (links.length === 0) throw new Error('DDG returned no results.');
    const top = links.slice(0, limit);
    const results = await Promise.all(top.map((link) => this.scrape(link)));
    return results;
  }

  private async fetchSearchLinks(
    query: string,
    maxRetries: number,
  ): Promise<{ url: string; title: string; snippet: string }[]> {
    let attempt = 0;
    while (true) {
      try {
        const res = await fetch(WebSearchService.DDG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': WebSearchService.BROWSER_UA,
          },
          body: new URLSearchParams({ q: query }).toString(),
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
        return this.parseDDGLiteHtml(await res.text());
      } catch (err: any) {
        if (attempt >= maxRetries) throw err;
        const wait = 300 * Math.pow(2, attempt);
        this.logger.warn(
          `DDG attempt ${attempt + 1} failed (${err.message}). Retrying in ${wait}ms...`,
        );
        await new Promise((r) => setTimeout(r, wait));
        attempt++;
      }
    }
  }

  private parseDDGLiteHtml(
    html: string,
  ): { url: string; title: string; snippet: string }[] {
    const $ = cheerio.load(html);
    const results: { url: string; title: string; snippet: string }[] = [];

    $('a.result-link').each((_i, el) => {
      const url = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      const snippet = $(el)
        .closest('tr')
        .next('tr')
        .find('.result-snippet')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
        results.push({ url, title, snippet });
      }
    });

    return results;
  }

  private async scrape(link: {
    url: string;
    title: string;
    snippet: string;
  }): Promise<WebSearchResult> {
    try {
      const res = await fetch(link.url, {
        headers: { 'User-Agent': WebSearchService.BROWSER_UA },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const $ = cheerio.load(html);

      $('script, style, nav, footer, header, aside, iframe, noscript, svg, form, button, [role="navigation"], [role="banner"], [role="complementary"]').remove();

      const bodyText = $('body')
        .text()
        .replace(/\s{2,}/g, ' ')
        .trim();

      const content =
        bodyText.length > 200 ? bodyText.substring(0, 3000) : link.snippet;

      this.logger.log(`Scraped ${link.url} (${content.length} chars)`);
      return { ...link, content };
    } catch (err: any) {
      this.logger.warn(
        `Could not scrape ${link.url} (${err.message}), using DDG snippet.`,
      );
      return { ...link, content: link.snippet };
    }
  }
}
