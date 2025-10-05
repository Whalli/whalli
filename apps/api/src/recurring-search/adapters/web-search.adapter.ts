import { Injectable } from '@nestjs/common';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedDate?: string;
}

@Injectable()
export class WebSearchAdapter {
  /**
   * Stub implementation for web search
   * In production, integrate with real search API (Google Custom Search, Bing, etc.)
   */
  async search(query: string): Promise<SearchResult[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return stub results
    const stubResults: SearchResult[] = [
      {
        title: `Result 1 for "${query}"`,
        url: `https://example.com/result-1?q=${encodeURIComponent(query)}`,
        snippet: `This is a sample search result snippet for the query "${query}". In production, this would be real search results from a search engine API.`,
        source: 'Example Source 1',
        publishedDate: new Date().toISOString(),
      },
      {
        title: `Result 2 for "${query}"`,
        url: `https://example.com/result-2?q=${encodeURIComponent(query)}`,
        snippet: `Another relevant result for "${query}". This demonstrates multiple results being returned from the search adapter.`,
        source: 'Example Source 2',
        publishedDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        title: `Result 3 for "${query}"`,
        url: `https://example.com/result-3?q=${encodeURIComponent(query)}`,
        snippet: `Third search result for "${query}". Production implementation would use Google Custom Search API, Bing Search API, or similar.`,
        source: 'Example Source 3',
        publishedDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
    ];

    return stubResults;
  }

  /**
   * Production implementation example with Google Custom Search API
   * 
   * async search(query: string): Promise<SearchResult[]> {
   *   const apiKey = this.configService.get<string>('GOOGLE_SEARCH_API_KEY');
   *   const cx = this.configService.get<string>('GOOGLE_SEARCH_CX');
   *   
   *   const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
   *     params: {
   *       key: apiKey,
   *       cx,
   *       q: query,
   *       num: 10,
   *     },
   *   });
   *   
   *   return response.data.items.map(item => ({
   *     title: item.title,
   *     url: item.link,
   *     snippet: item.snippet,
   *     source: item.displayLink,
   *     publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
   *   }));
   * }
   */
}
