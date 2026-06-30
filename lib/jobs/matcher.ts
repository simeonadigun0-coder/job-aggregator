import Groq from 'groq-sdk'

// Lazily instantiated so build-time evaluation doesn't require the key
let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

export interface MatchResult {
  score: number // 0-100
  reason: string
  isStrongMatch: boolean
}

export async function matchJobToResume(
  resumeText: string,
  jobTitle: string,
  jobDescription: string
): Promise<MatchResult> {
  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a job-matching assistant. Compare a resume against a job posting and output ONLY valid JSON, no preamble, no markdown fences, in this exact shape:
{"score": <integer 0-100>, "reason": "<one sentence, max 20 words>"}

Score guide:
- 80-100: strong match, skills/experience align well
- 50-79: partial match, some relevant overlap
- 0-49: weak or no match`,
        },
        {
          role: 'user',
          content: `RESUME:\n${resumeText.slice(0, 3000)}\n\nJOB TITLE: ${jobTitle}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0))

    return {
      score,
      reason: parsed.reason || 'No reason provided',
      isStrongMatch: score >= 75,
    }
  } catch (err) {
    console.error('Match scoring failed:', err)
    return { score: 0, reason: 'Matching failed', isStrongMatch: false }
  }
}
