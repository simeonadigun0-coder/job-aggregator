import JobsPage from '@/components/JobsPage'

export default function Page({ searchParams }: { searchParams: { sort?: string; type?: string } }) {
  const config = {
    all: { filter: 'all' as const, title: 'All Jobs', emoji: '🌐' },
    nigerian: { filter: 'nigerian' as const, title: 'Nigerian Jobs', emoji: '🇳🇬' },
    remote: { filter: 'remote' as const, title: 'Remote Jobs', emoji: '🌍' },
    hybrid: { filter: 'hybrid' as const, title: 'Hybrid Jobs', emoji: '🏢' },
  }['hybrid']!
  return <JobsPage {...config} searchParams={searchParams} />
}
