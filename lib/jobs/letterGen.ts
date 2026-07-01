import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

export interface TailoredLetter {
  letter: string
  subject: string
}

export async function generateTailoredLetter(
  template: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  applicantName: string,
  applicantPhone: string,
  applicantEmail: string,
  linkedinUrl?: string,
  portfolioUrl?: string
): Promise<TailoredLetter> {

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a professional job application assistant. Your ONLY job is to lightly personalise a cover letter template for a specific job application.

STRICT RULES — follow these exactly:
1. Keep 90% of the template word-for-word. Do NOT rewrite it.
2. Only change: the company name, job title, and ONE paragraph that explains why the applicant wants THIS specific role at THIS specific company.
3. That one personalised paragraph must sound completely human — conversational, warm, specific. No buzzwords like "leverage", "synergy", "passionate about", "dynamic team".
4. Do NOT add any AI-sounding phrases, do NOT make it sound formal or robotic.
5. Replace any placeholder like [Company], [Role], [Position] with the actual values.
6. Keep the same tone, length, and structure as the original template.
7. Return ONLY the letter text — no subject line in the body, no explanation, no preamble.
8. End with the applicant's full sign-off block.`,
      },
      {
        role: 'user',
        content: `Personalise this cover letter for the following application:

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION SNIPPET: ${jobDescription.slice(0, 1200)}

APPLICANT DETAILS:
Name: ${applicantName}
Email: ${applicantEmail}
Phone: ${applicantPhone}
${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : ''}
${portfolioUrl ? `Portfolio: ${portfolioUrl}` : ''}

ORIGINAL TEMPLATE:
${template}`,
      },
    ],
    temperature: 0.4, // Low temp = stays close to original, doesn't hallucinate
    max_tokens: 1500,
  })

  const letter = completion.choices[0]?.message?.content?.trim() || template

  // Generate email subject separately
  const subjectCompletion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `Write a professional email subject line for a job application.
Role: ${jobTitle}
Company: ${company}
Applicant: ${applicantName}

Rules: Keep it under 10 words. Sound human, not templated. Do NOT use "Application for" as the opener — be slightly more direct. Return ONLY the subject line, nothing else.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 50,
  })

  const subject = subjectCompletion.choices[0]?.message?.content?.trim()
    || `${jobTitle} – ${applicantName}`

  return { letter, subject }
}
