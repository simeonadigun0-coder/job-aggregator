import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTailoredLetter } from '@/lib/jobs/letterGen'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId, jobTitle, company, jobDescription, applyUrl } = await request.json()

  // Fetch full profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.cover_letter_template) {
    return NextResponse.json(
      { error: 'Please add your cover letter template in your Profile first.' },
      { status: 400 }
    )
  }

  if (!profile?.display_name || !profile?.gmail_address) {
    return NextResponse.json(
      { error: 'Please complete your Profile (name and Gmail address required).' },
      { status: 400 }
    )
  }

  try {
    const { letter, subject } = await generateTailoredLetter(
      profile.cover_letter_template,
      jobTitle,
      company,
      jobDescription || '',
      profile.display_name,
      profile.phone || '',
      profile.gmail_address,
      profile.linkedin_url || undefined,
      profile.portfolio_url || undefined
    )

    // Save draft application to DB
    const { data: application } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        job_id: jobId || null,
        company,
        job_title: jobTitle,
        apply_url: applyUrl || null,
        generated_letter: letter,
        status: 'draft',
      })
      .select()
      .single()

    return NextResponse.json({
      applicationId: application?.id,
      letter,
      subject,
      hasEmail: false, // HR email extraction not available without scraping
    })
  } catch (err) {
    console.error('Letter generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate letter. Please try again.' }, { status: 500 })
  }
}
