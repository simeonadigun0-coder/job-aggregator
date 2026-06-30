import Parser from 'rss-parser'
import { NormalizedJob } from '../types'

const parser = new Parser()

// We Work Remotely: free RSS feed, no key needed
export async function fetchWeWorkRemotely(): Promise<NormalizedJob[]> {
  try {
    const feed = await parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss')

    return feed.items.map((item): NormalizedJob => {
      // WWR titles are usually "Company: Job Title"
      const [company, ...titleParts] = (item.title || '').split(':')
      const title = titleParts.length ? titleParts.join(':').trim() : item.title || 'Untitled'

      return {
        external_id: `wwr-${item.guid || item.link}`,
        source: 'wwr',
        title,
        company: titleParts.length ? company.trim() : null,
        location: 'Remote',
        country: 'Remote',
        job_type: 'remote',
        description: (item.contentSnippet || item.content || '').slice(0, 5000),
        apply_url: item.link || null,
        salary_text: null,
        posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        raw_data: item as Record<string, unknown>,
      }
    })
  } catch (err) {
    console.error('WWR fetch failed:', err)
    return []
  }
}
