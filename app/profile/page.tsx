'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ProfileForm = {
  display_name: string
  phone: string
  location: string
  linkedin_url: string
  portfolio_url: string
  gmail_address: string
  gmail_app_password: string
  cover_letter_template: string
  auto_apply_enabled: boolean
  signature_image_url: string
}

const EMPTY: ProfileForm = {
  display_name: '', phone: '', location: '', linkedin_url: '',
  portfolio_url: '', gmail_address: '', gmail_app_password: '',
  cover_letter_template: '', auto_apply_enabled: false, signature_image_url: '',
}

export default function ProfilePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'letter' | 'email'>('personal')
  const [form, setForm] = useState<ProfileForm>(EMPTY)
  const [showPass, setShowPass] = useState(false)

  // All Supabase calls happen inside effects — never at module level
  const loadProfile = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setForm(f => ({ ...f, ...data }))
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function update(key: keyof ProfileForm, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSig(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingSig(false); return }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/signature.${ext}`
    const { error } = await supabase.storage.from('signatures').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(path)
      update('signature_image_url', publicUrl)
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_image_url: publicUrl }),
      })
    }
    setUploadingSig(false)
  }

  const tabs = [
    { id: 'personal' as const, label: 'Personal Info' },
    { id: 'letter' as const, label: 'Cover Letter' },
    { id: 'email' as const, label: 'Email & Sending' },
  ]

  const inp: React.CSSProperties = {
    background: '#0a0e1a', border: '1px solid #1e2d4a',
    color: '#e8dcc8', borderRadius: '8px',
    padding: '10px 14px', fontSize: '14px', width: '100%', outline: 'none',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '600',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#c9a84c', marginBottom: '6px',
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      {/* Header */}
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} style={{ color: '#6b7a99', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Dashboard
            </button>
            <span style={{ color: '#1e2d4a' }}>·</span>
            <span style={{ color: '#c9a84c', fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Profile</span>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="text-xs font-semibold px-4 py-2 rounded-lg tracking-wider uppercase transition-all"
            style={{ background: saved ? '#0a1a0a' : 'linear-gradient(135deg,#c9a84c,#8a6f2e)', color: saved ? '#4ade80' : '#000' }}>
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg tracking-wider uppercase transition-all"
              style={activeTab === tab.id
                ? { background: 'linear-gradient(135deg,#c9a84c,#8a6f2e)', color: '#000' }
                : { color: '#6b7a99', background: 'none', border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* PERSONAL */}
        {activeTab === 'personal' && (
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>Personal Information</h2>
            <p className="text-xs" style={{ color: '#6b7a99' }}>Used in your application emails and signature.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label style={lbl}>Full Name *</label>
                <input style={inp} value={form.display_name || ''} onChange={e => update('display_name', e.target.value)} placeholder="Simeon Adigun" />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input style={inp} value={form.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="+234 800 000 0000" />
              </div>
              <div>
                <label style={lbl}>Location</label>
                <input style={inp} value={form.location || ''} onChange={e => update('location', e.target.value)} placeholder="Lagos, Nigeria" />
              </div>
              <div>
                <label style={lbl}>LinkedIn URL</label>
                <input style={inp} value={form.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="sm:col-span-2">
                <label style={lbl}>Portfolio / Website (optional)</label>
                <input style={inp} value={form.portfolio_url || ''} onChange={e => update('portfolio_url', e.target.value)} placeholder="https://yourportfolio.com" />
              </div>
            </div>

            {/* Signature */}
            <div>
              <label style={lbl}>Signature Image (optional)</label>
              <p className="text-xs mb-3" style={{ color: '#6b7a99' }}>
                Upload an image of your handwritten signature — it appears at the bottom of every email application.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                {form.signature_image_url && (
                  <div className="p-3 rounded-lg" style={{ background: '#fff' }}>
                    <img src={form.signature_image_url} alt="Signature" style={{ height: '40px', objectFit: 'contain' }} />
                  </div>
                )}
                <label className="text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer tracking-wider uppercase"
                  style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  {uploadingSig ? 'Uploading...' : form.signature_image_url ? 'Replace Signature' : 'Upload Signature'}
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} disabled={uploadingSig} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* COVER LETTER */}
        {activeTab === 'letter' && (
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>Cover Letter Template</h2>
            <div className="p-4 rounded-lg" style={{ background: '#0a1a0a', border: '1px solid #1a3a1a' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#4a8a4a' }}>
                ◆ Write your cover letter in your own words. Use <strong>[Company]</strong> and <strong>[Role]</strong> as placeholders.
                The AI only swaps those in and adjusts one paragraph per application — your voice stays intact.
              </p>
            </div>
            <textarea
              value={form.cover_letter_template || ''}
              onChange={e => update('cover_letter_template', e.target.value)}
              rows={18}
              placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in the [Role] position at [Company]...&#10;&#10;[Continue in your own words...]&#10;&#10;Kind regards,&#10;Your Name"
              className="w-full rounded-lg p-4 text-sm resize-none outline-none"
              style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8', fontFamily: 'Georgia, serif', lineHeight: '1.8' }}
            />
            <p className="text-xs" style={{ color: '#3a4a6a' }}>
              {(form.cover_letter_template || '').length > 0 ? `${form.cover_letter_template.length} characters · ` : ''}
              Aim for 250–400 words.
            </p>
          </div>
        )}

        {/* EMAIL & SENDING */}
        {activeTab === 'email' && (
          <div className="space-y-5">
            <div className="rounded-xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#e8dcc8' }}>Gmail Configuration</h2>
              <div className="p-4 rounded-lg" style={{ background: '#0a0e1a', border: '1px solid #1e2d4a' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#6b7a99' }}>
                  Applications are sent from your Gmail. You need a <strong style={{ color: '#c9a84c' }}>Gmail App Password</strong> — not your regular password.<br /><br />
                  To get one: <strong style={{ color: '#e8dcc8' }}>Google Account → Security → 2-Step Verification → App Passwords</strong> → create one for &quot;Mail&quot;. Copy the 16-character code it gives you.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label style={lbl}>Gmail Address *</label>
                  <input style={inp} type="email" value={form.gmail_address || ''} onChange={e => update('gmail_address', e.target.value)} placeholder="you@gmail.com" />
                </div>
                <div>
                  <label style={lbl}>Gmail App Password *</label>
                  <div className="relative">
                    <input
                      style={{ ...inp, paddingRight: '40px' }}
                      type={showPass ? 'text' : 'password'}
                      value={form.gmail_app_password || ''}
                      onChange={e => update('gmail_app_password', e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: showPass ? '#c9a84c' : '#3a4a6a', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                      {showPass ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Consent toggle */}
            <div className="rounded-xl p-6" style={{ background: '#111827', border: '1px solid #c9a84c44' }}>
              <div className="flex items-start gap-4">
                <button onClick={() => update('auto_apply_enabled', !form.auto_apply_enabled)}
                  className="mt-0.5 shrink-0 relative transition-all"
                  style={{ width: '40px', height: '24px', borderRadius: '12px', background: form.auto_apply_enabled ? '#c9a84c' : '#1e2d4a', border: 'none', cursor: 'pointer' }}>
                  <div style={{
                    position: 'absolute', top: '4px', width: '16px', height: '16px',
                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    left: form.auto_apply_enabled ? '20px' : '4px',
                  }} />
                </button>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#e8dcc8' }}>Enable Auto-Apply</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7a99' }}>
                    I consent to JobHunt generating and sending job applications on my behalf using my cover letter template, profile information, and Gmail account.
                    I understand I will always review the letter before it is sent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
