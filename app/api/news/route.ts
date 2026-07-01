import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a job market intelligence analyst. Generate exactly 6 realistic, current-sounding job market news items for English-speaking countries (UK, US, Canada, Australia, Nigeria, Germany, Denmark, Ireland).

Focus on: company hiring announcements, remote work trends, recruitment news, expansions, salary trends, in-demand skills.

Respond ONLY with a valid JSON array, no preamble, no markdown fences:
[{"headline":"...","summary":"...","country":"UK","category":"Hiring","sentiment":"positive"}]

Categories: Hiring, Remote, Layoffs, Salaries, Skills, Market
Countries: UK, US, Nigeria, Canada, Germany, Australia, Global
Sentiment: positive, neutral, negative`
        },
        {
          role: 'user',
          content: `Generate 6 job market news items for ${new Date().toDateString()}. Make them relevant to someone job hunting internationally, especially for remote and hybrid roles.`
        }
      ],
      temperature: 0.8,
      max_tokens: 900,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || '[]'
    const clean = raw.replace(/```json|```/g, '').trim()
    const news = JSON.parse(clean)
    return NextResponse.json({ news, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('News fetch failed:', err)
    return NextResponse.json({ news: [], error: 'Could not load news' })
  }
}
