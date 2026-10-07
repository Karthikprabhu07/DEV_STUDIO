import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  BookOpen,
  Plus,
  ExternalLink,
  Search,
  Tag,
  Code2,
  Sparkles,
  Server,
  Palette,
  ShieldAlert,
  X,
  Layers,
} from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { ResourceCategory, ResourceDifficulty } from '@/types'

export const ResourcesPage: React.FC = () => {
  const { isStaff } = useAuth()
  const { resources, createResource } = useCommunity()

  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<ResourceDifficulty | 'all'>('all')

  // Add Resource Modal (Staff)
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false)
  const [resTitle, setResTitle] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [resCategory, setResCategory] = useState<ResourceCategory>('full_stack')
  const [resDesc, setResDesc] = useState('')
  const [resTags, setResTags] = useState('')
  const [resDifficulty, setResDifficulty] = useState<ResourceDifficulty>('intermediate')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const categories: { id: ResourceCategory | 'all'; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Tracks', icon: Layers },
    { id: 'full_stack', label: 'Full Stack', icon: Code2 },
    { id: 'vibe_coding', label: 'Vibe Coding & AI', icon: Sparkles },
    { id: 'deployment', label: 'Cloud & Deploy', icon: Server },
    { id: 'ui_ux', label: 'UI / UX Design', icon: Palette },
    { id: 'cybersecurity', label: 'Cybersecurity', icon: ShieldAlert },
  ]

  const filteredResources = resources.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || r.difficulty === selectedDifficulty
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesDifficulty && matchesSearch
  })

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resTitle.trim() || !resUrl.trim() || !resDesc.trim()) {
      setFormError('Title, URL, and description are required.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const tagsArray = resTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const res = await createResource({
      title: resTitle.trim(),
      url: resUrl.trim(),
      category: resCategory,
      description: resDesc.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['Engineering'],
      difficulty: resDifficulty,
    })

    setIsSubmitting(false)
    if (res.success) {
      setIsAddResourceOpen(false)
      setResTitle('')
      setResUrl('')
      setResDesc('')
      setResTags('')
    } else {
      setFormError(res.error || 'Failed to add resource.')
    }
  }

  const getDifficultyBadge = (diff: ResourceDifficulty) => {
    switch (diff) {
      case 'beginner':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-status-success/10 text-status-success border border-status-success/30">Beginner</span>
      case 'intermediate':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">Intermediate</span>
      case 'advanced':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/30">Advanced</span>
    }
  }

  const getCategoryLabel = (cat: ResourceCategory) => {
    switch (cat) {
      case 'full_stack':
        return 'Full Stack'
      case 'vibe_coding':
        return 'Vibe Coding'
      case 'deployment':
        return 'Deployment'
      case 'ui_ux':
        return 'UI / UX'
      case 'cybersecurity':
        return 'Cybersecurity'
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <Helmet>
        <title>Resources | DevStudio</title>
        <meta name="description" content="Learning materials, guides, and resources for DevStudio members." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/resources" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-[11px] font-mono text-accent-primary mb-2">
            <BookOpen className="w-3 h-3" />
            <span>Curated Engineering Knowledge Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-mono">
            Resource Hub
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Curated developer knowledge across Full Stack, Vibe Coding, Cloud Deployment, UI/UX, and Cybersecurity.
          </p>
        </div>

        {isStaff && (
          <Button
            id="add-resource-btn"
            onClick={() => setIsAddResourceOpen(true)}
            size="sm"
            variant="default"
            className="gap-2 font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>Curate Resource</span>
          </Button>
        )}
      </div>

      {/* Category Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((c) => {
          const Icon = c.icon
          const isActive = selectedCategory === c.id
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-bg-surface text-accent-primary border border-border-default shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-surface border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            id="search-resources-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, cheat-sheets, concepts..."
            className="w-full bg-bg-surface border border-border-default rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-lg border border-border-default self-start sm:self-auto">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded text-xs font-mono capitalize transition-all ${
                selectedDifficulty === diff
                  ? 'bg-bg-page text-accent-primary border border-border-default'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid / Empty State */}
      {filteredResources.length === 0 ? (
        <Card className="bg-bg-surface border-border-default">
          <CardContent className="pt-6">
            <EmptyState
              icon={BookOpen}
              title={
                searchQuery || selectedCategory !== 'all'
                  ? 'No Resources Match Filter'
                  : 'Resource Hub Empty'
              }
              description={
                searchQuery || selectedCategory !== 'all'
                  ? 'No technical guides or documentation match your current filters.'
                  : 'Official learning tracks and technical cheat-sheets will be published here by Dev Captains and Directors.'
              }
              actionLabel={
                isStaff && !searchQuery && selectedCategory === 'all'
                  ? 'Curate First Resource'
                  : undefined
              }
              onAction={
                isStaff && !searchQuery && selectedCategory === 'all'
                  ? () => setIsAddResourceOpen(true)
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              className="bg-[#0A0F1D] border-border-default rounded-3xl shadow-xl flex flex-col justify-between hover:border-accent-purple/50 transition-all group overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="px-3 py-1 text-[10px] font-bold font-mono rounded bg-bg-page border border-border-default text-accent-purple uppercase tracking-wider">
                    {getCategoryLabel(res.category)}
                  </span>
                  {getDifficultyBadge(res.difficulty)}
                </div>

                <h3 className="font-sans font-black text-xl text-text-primary group-hover:text-accent-purple transition-colors line-clamp-2">
                  {res.title}
                </h3>

                <p className="text-xs font-sans font-medium text-text-muted line-clamp-3 leading-relaxed">
                  {res.description}
                </p>

                {res.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {res.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-page border border-border-default text-[10px] font-bold font-mono text-text-muted tracking-wider"
                      >
                        <Tag className="w-3 h-3 text-text-muted" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-bg-surface/50 border-t border-border-default flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">
                  Curated by DevStudio
                </span>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center min-h-[36px] px-4 gap-2 rounded-xl bg-bg-page hover:bg-bg-surface text-xs font-bold font-sans text-accent-purple hover:text-accent-purple/80 border border-border-default transition-colors cursor-pointer shadow-sm"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Resource Modal (Staff) */}
      {isAddResourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-teal/10 rounded-lg">
                   <BookOpen className="w-5 h-5 text-accent-teal" />
                 </div>
                <span>Curate Learning Resource</span>
              </h3>
              <button
                onClick={() => setIsAddResourceOpen(false)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/20 text-xs text-status-destructive font-mono font-bold uppercase tracking-wider">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateResource} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js 15 App Router & Server Actions Guide"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Destination URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Track Category</label>
                  <select
                    value={resCategory}
                    onChange={(e) => setResCategory(e.target.value as ResourceCategory)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:outline-none transition-all font-mono text-xs uppercase tracking-wider appearance-none"
                  >
                    <option value="full_stack">Full Stack</option>
                    <option value="vibe_coding">Vibe Coding & AI</option>
                    <option value="deployment">Cloud & Deployment</option>
                    <option value="ui_ux">UI / UX Design</option>
                    <option value="cybersecurity">Cybersecurity</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Difficulty</label>
                  <select
                    value={resDifficulty}
                    onChange={(e) => setResDifficulty(e.target.value as ResourceDifficulty)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:outline-none transition-all font-mono text-xs uppercase tracking-wider appearance-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Key takeaways and practical application for MITE developers..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Routing, Performance"
                  value={resTags}
                  onChange={(e) => setResTags(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddResourceOpen(false)}
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-sans text-xs font-bold gap-2 bg-accent-teal hover:bg-accent-teal/90 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  {isSubmitting ? 'Curating...' : 'Publish to Hub'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
