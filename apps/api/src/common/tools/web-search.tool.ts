import { AgentTool } from './agent-tool';
import * as cheerio from 'cheerio';

/**
 * Gives the LLM the ability to search the web via DuckDuckGo Lite.
 * Returns a list of URLs and their text snippets for the LLM to evaluate.
 */
export class WebSearchTool extends AgentTool {
  name = 'web_search';
  description =
    'Search the web using DuckDuckGo for current information. ' +
    'Returns a JSON array of { url, title, snippet } objects. ' +
    'Use this tool when the user needs recent information or when local knowledge is insufficient.';

  schema = {
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up on DuckDuckGo.',
      },
      limit: {
        type: 'number',
        description: 'Number of results to return. Default is 5. Max is 10.',
      },
    },
    required: ['query'],
  };

  private static readonly DDG_ENDPOINT = 'https://lite.duckduckgo.com/lite/';
  private static readonly BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  async execute(args: Record<string, any>): Promise<string> {
    const query: string = args.query;
    const limit: number = Math.min(args.limit ?? 5, 10);

    if (!query) return 'Error: query is required for web_search.';

    try {
      const results = await this.fetchSearchLinks(query, 2);
      const top = results.slice(0, limit);

      if (top.length === 0) {
        return 'No search results found for: ' + query;
      }

      return JSON.stringify(top, null, 2);
    } catch (e: any) {
      return `Web search failed: ${e.message}`;
    }
  }

  private async fetchSearchLinks(
    query: string,
    maxRetries: number,
  ): Promise<{ url: string; title: string; snippet: string }[]> {
    let attempt = 0;
    while (true) {
      try {
        const res = await fetch(WebSearchTool.DDG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': WebSearchTool.BROWSER_UA,
          },
          body: new URLSearchParams({ q: query }).toString(),
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
        return this.parseDDGLiteHtml(await res.text());
      } catch (err: any) {
        if (attempt >= maxRetries) throw err;
        const wait = 300 * Math.pow(2, attempt);
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
}
