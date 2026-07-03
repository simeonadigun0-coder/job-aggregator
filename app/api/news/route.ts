import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NEWS_RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business' },
  { url: 'https://www.theguardian.com/money/work-and-careers/rss', source: 'The Guardian' },
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
  { url: 'https://www.reuters.com/rssFeed/businessNews', source: 'Reuters' },
]

const JOB_KEYWORDS = [
  'hiring', 'recruitment', 'jobs', 'layoff', 'workforce', 'remote work',
  'salary', 'employment', 'career', 'tech jobs', 'workers', 'companies hiring'
]

interface NewsItem {
  headline: string
  summary: string
  url: string
  source: string
  category: string
  publishedAt: string
}

async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 JobHunt/1.0' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []

    const xml = await res.text()
    const items: NewsItem[] = []

    // Parse RSS items with regex (no external parser needed)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1]
      const title = extractTag(item, 'title')
      const link = extractTag(item, 'link') || extractTag(item, 'guid')
      const description = extractTag(item, 'description')
      const pubDate = extractTag(item, 'pubDate')

      if (!title || !link) continue

      // Only include job/career related news
      const fullText = `${title} ${description}`.toLowerCase()
      const isRelevant = JOB_KEYWORDS.some(kw => fullText.includes(kw))
      if (!isRelevant) continue

      const category = categorise(fullText)

      items.push({
        headline: cleanText(title),
        summary: cleanText(description).slice(0, 150),
        url: link.replace(/^.*?(https?:\/\/)/, '$1'),
        source: sourceName,
        category,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      })

      if (items.length >= 4) break
    }

    return items
  } catch {
    return []
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return match ? match[1].trim() : ''
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function categorise(text: string): string {
  if (text.includes('layoff') || text.includes('redundan') || text.includes('cut')) return 'Layoffs'
  if (text.includes('remote') || text.includes('work from home')) return 'Remote'
  if (text.includes('salary') || text.includes('pay') || text.includes('wage')) return 'Salaries'
  if (text.includes('hiring') || text.includes('recruit') || text.includes('vacancies')) return 'Hiring'
  if (text.includes('tech') || text.includes('ai') || text.includes('software')) return 'Tech'
  return 'Market'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    NEWS_RSS_FEEDS.map(f => fetchRSSFeed(f.url, f.source))
  )

  let allNews: NewsItem[] = []
  results.forEach(r => {
    if (r.status === 'fulfilled') allNews.push(...r.value)
  })

  // Sort by date, newest first
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  // Dedupe by headline similarity
  const seen = new Set<string>()
  allNews = allNews.filter(item => {
    const key = item.headline.toLowerCase().slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // If RSS fails, fall back to Groq-generated news
  if (allNews.length < 3) {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Generate 6 realistic job market news items for English-speaking countries. Return ONLY valid JSON array:
[{"headline":"...","summary":"...","url":"https://...","source":"...","category":"Hiring|Remote|Layoffs|Salaries|Tech|Market","publishedAt":"${new Date().toISOString()}"}]
Make URLs point to real news sites like bbc.com, reuters.com, theguardian.com. No markdown, no preamble.`,
        },
        { role: 'user', content: 'Generate news for today.' },
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    try {
      const raw = completion.choices[0]?.message?.content?.trim() || '[]'
      const fallback = JSON.parse(raw.replace(/```json|```/g, '').trim())
      allNews = fallback
    } catch { allNews = [] }
  }

  return NextResponse.json({
    news: allNews.slice(0, 9),
    generatedAt: new Date().toISOString(),
    source: allNews.length >= 3 ? 'live' : 'generated',
  })
}
