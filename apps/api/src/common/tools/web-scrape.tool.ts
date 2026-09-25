import { AgentTool } from './agent-tool';
import * as cheerio from 'cheerio';

/**
 * Gives the LLM the ability to read the full text content of a specific URL.
 * The LLM should call this after web_search to get deeper context from a result.
 */
export class WebScrapeTool extends AgentTool {
  name = 'web_scrape';
  description =
    'Read and extract the full text content of a specific web page URL. ' +
    'Use this after web_search to read the full article or page for any URL that looks relevant. ' +
    'Returns the cleaned text content of the page, up to 4000 characters.';

  schema = {
    properties: {
      url: {
        type: 'string',
        description: 'The full URL (starting with http:// or https://) of the web page to scrape.',
      },
    },
    required: ['url'],
  };

  private static readonly BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  async execute(args: Record<string, any>): Promise<string> {
    const url: string = args.url;

    if (!url || !url.startsWith('http')) {
      return 'Error: A valid URL starting with http:// or https:// is required.';
    }

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': WebScrapeTool.BROWSER_UA },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return `Error: Could not fetch URL. HTTP status ${res.status} (${res.statusText}).`;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Remove non-content elements
      $(
        'script, style, nav, footer, header, aside, iframe, noscript, svg, form, button, ' +
          '[role="navigation"], [role="banner"], [role="complementary"]',
      ).remove();

      const bodyText = $('body')
        .text()
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!bodyText || bodyText.length < 50) {
        return `Page at ${url} had no readable text content.`;
      }

      // Return up to 4000 chars to keep the context window manageable
      const content = bodyText.substring(0, 4000);
      return `Content from ${url}:\n\n${content}`;
    } catch (e: any) {
      return `Failed to scrape ${url}: ${e.message}`;
    }
  }
}
