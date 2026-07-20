import { Resend } from 'resend'

// RESEND_FROM_EMAIL should be an address on a domain you've verified in
// Resend (https://resend.com/domains). Until then, Resend's shared
// onboarding@resend.dev sender works for testing but can only send to the
// email address on your own Resend account — fine for solo testing, not
// for real users.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'JobHunt <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://job-aggregator-virid.vercel.app'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendNewMatchesEmail(
  toEmail: string,
  firstName: string,
  newMatchCount: number,
  strongMatchCount: number
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const strongLine = strongMatchCount > 0
    ? `${strongMatchCount} of them ${strongMatchCount === 1 ? 'is a' : 'are'} strong match${strongMatchCount === 1 ? '' : 'es'} for your profile.`
    : `Take a look and see what fits.`

  const html = `
<div style="font-family: Georgia, serif; font-size: 15px; line-height: 1.7; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
  <p style="margin: 0 0 16px 0;">${greeting}</p>
  <p style="margin: 0 0 16px 0;">
    You have <strong>${newMatchCount} new job match${newMatchCount === 1 ? '' : 'es'}</strong> today. ${strongLine}
  </p>
  <p style="margin: 0 0 24px 0;">
    <a href="${APP_URL}/dashboard" style="background: #c9a84c; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
      View Your Matches
    </a>
  </p>
  <p style="margin: 0; font-size: 13px; color: #666;">— JobHunt</p>
</div>`

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `You have ${newMatchCount} new job match${newMatchCount === 1 ? '' : 'es'} today`,
      html,
    })
    if (result.error) return { success: false, error: result.error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
