import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Allow ALL profile fields to be saved
  const allowed = [
    'display_name', 'phone', 'location', 'linkedin_url',
    'portfolio_url', 'gmail_address', 'gmail_app_password',
    'cover_letter_template', 'auto_apply_enabled',
    'signature_image_url', 'resume_filename', 'resume_text',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body && body[key] !== undefined) {
      updates[key] = body[key] === '' ? null : body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true, message: 'Nothing to update' })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Profile save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
