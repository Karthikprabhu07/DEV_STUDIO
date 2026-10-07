import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  FolderGit2,
  Plus,
  ExternalLink,
  Search,
  Layers,
  Users,
  X,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react'

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { Project, TaskPriority, TaskStatus } from '@/types'

export const ProjectsPage: React.FC = () => {
  const { profile, isActiveMember, isStaff } = useAuth()
  const {
    projects,
    tasks,
    members,
    createProject,
    joinProject,
    leaveProject,
    createTask,
    updateTaskStatus,
    deleteTask,
  } = useCommunity()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'my'>('all')
  const [selectedTech, setSelectedTech] = useState<string | null>(null)

  // Workspace modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'board' | 'team'>('board')

  // New Project modal
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newGithub, setNewGithub] = useState('')
  const [newDemo, setNewDemo] = useState('')
  const [newStack, setNewStack] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // New Task modal / form
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium')

  // Filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
        ? p.status === 'active'
        : activeFilter === 'completed'
        ? p.status === 'completed'
        : members.some((m) => m.project_id === p.id && m.user_id === profile?.id)

    const matchesTech = !selectedTech || p.tech_stack.includes(selectedTech)

    return matchesSearch && matchesStatus && matchesTech
  })

  // Extract all unique tech tags
  const allTechTags = Array.from(new Set(projects.flatMap((p) => p.tech_stack)))

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDesc.trim()) {
      setFormError('Title and description are required.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const stackArray = newStack
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await createProject({
      title: newTitle.trim(),
      description: newDesc.trim(),
      github_repo_url: newGithub.trim() || undefined,
      live_demo_url: newDemo.trim() || undefined,
      tech_stack: stackArray.length > 0 ? stackArray : ['Full Stack'],
    })

    setIsSubmitting(false)
    if (res.success && res.project) {
      setIsNewProjectOpen(false)
      setNewTitle('')
      setNewDesc('')
      setNewGithub('')
      setNewDemo('')
      setNewStack('')
      setSelectedProject(res.project)
    } else {
      setFormError(res.error || 'Failed to create project.')
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !taskTitle.trim()) return

    await createTask(selectedProject.id, {
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      priority: taskPriority,
    })

    setTaskTitle('')
    setTaskDesc('')
    setTaskPriority('medium')
    setIsNewTaskOpen(false)
  }

  const isMemberOfSelected = selectedProject
    ? members.some((m) => m.project_id === selectedProject.id && m.user_id === profile?.id)
    : false

  const projectTasks = selectedProject
    ? tasks.filter((t) => t.project_id === selectedProject.id)
    : []

  const projectMemberList = selectedProject
    ? members.filter((m) => m.project_id === selectedProject.id)
    : []

  const taskColumns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'border-slate-700' },
    { id: 'in_progress', label: 'In Progress', color: 'border-cyan-500/50' },
    { id: 'review', label: 'In Review', color: 'border-amber-500/50' },
    { id: 'completed', label: 'Completed', color: 'border-emerald-500/50' },
  ]

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-red-950 text-red-400 border border-red-800">URGENT</span>
      case 'high':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-950 text-amber-400 border border-amber-800">HIGH</span>
      case 'medium':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800">MED</span>
      case 'low':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">LOW</span>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <Helmet>
        <title>Projects | DevStudio</title>
        <meta name="description" content="Explore amazing projects built by DevStudio members." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/projects" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-[11px] font-mono text-accent-purple mb-2">
            <Layers className="w-3 h-3" />
            <span>Developer Workspaces & Software Repos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-mono">
            DevStudio Projects
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Software engineered, shipped, and maintained by MITE student developers.
          </p>
        </div>

        {isActiveMember && (
          <Button
            id="new-project-btn"
            onClick={() => setIsNewProjectOpen(true)}
            size="sm"
            className="gap-2 font-sans bg-[#3B82F6] hover:bg-blue-600 text-on-accent font-semibold rounded-xl px-4 py-2 shadow-md shadow-blue-500/25 border border-transparent hover:border-white cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            id="search-projects-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, stacks, tags..."
            className="w-full bg-bg-surface border border-border-default rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/50"
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-lg border border-border-default self-start md:self-auto">
          {(['all', 'active', 'completed', 'my'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-all ${
                activeFilter === filter
                  ? 'bg-bg-page text-accent-primary border border-border-default shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {filter === 'my' ? 'My Projects' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Tech Tags Filter */}
      {allTechTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-text-muted mr-2">Stacks:</span>
          {allTechTags.map((tech) => (
            <button
              key={tech}
              onClick={() => setSelectedTech(selectedTech === tech ? null : tech)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                selectedTech === tech
                  ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/40'
                  : 'bg-bg-surface text-text-muted border-border-default hover:border-border-default/80'
              }`}
            >
              {tech}
            </button>
          ))}
          {selectedTech && (
            <button
              onClick={() => setSelectedTech(null)}
              className="text-[10px] font-mono text-text-muted hover:text-text-primary underline ml-2"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Projects Grid / Empty State */}
      {filteredProjects.length === 0 ? (
        <Card className="bg-[#0A0F1D] border-border-default rounded-3xl shadow-2xl">
          <CardContent className="pt-12 pb-12">
            <EmptyState
              icon={FolderGit2}
              title={
                searchQuery || selectedTech || activeFilter !== 'all'
                  ? 'No Matching Projects'
                  : 'No Projects in Database'
              }
              description={
                searchQuery || selectedTech || activeFilter !== 'all'
                  ? 'No repositories match your active filter criteria. Try resetting search parameters.'
                  : 'No software projects have been registered yet. Active Dev Mates can register repositories and organize task boards.'
              }
              actionLabel={
                isActiveMember && !searchQuery && activeFilter === 'all'
                  ? 'Initialize First Project'
                  : undefined
              }
              onAction={
                isActiveMember && !searchQuery && activeFilter === 'all'
                  ? () => setIsNewProjectOpen(true)
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const projectMemberCount = members.filter((m) => m.project_id === project.id).length
            const projectTaskCount = tasks.filter((t) => t.project_id === project.id).length
            const completedCount = tasks.filter(
              (t) => t.project_id === project.id && t.status === 'completed'
            ).length
            const taskPct = projectTaskCount > 0 ? Math.round((completedCount / projectTaskCount) * 100) : 0

            return (
              <Card
                key={project.id}
                className="bg-[#0A0F1D] border-border-default rounded-3xl shadow-xl flex flex-col justify-between hover:border-accent-teal/50 transition-all group overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="font-sans font-black text-xl text-text-primary group-hover:text-accent-teal transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider font-mono border ${
                        project.status === 'active'
                          ? 'bg-status-success/15 text-status-success border-status-success/40'
                          : 'bg-bg-page text-text-muted border-border-default'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted line-clamp-2 mb-6 leading-relaxed font-sans font-medium">
                    {project.description}
                  </p>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech_stack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 rounded bg-[#1A2333] border border-border-default text-[10px] font-mono text-accent-teal font-bold tracking-wider uppercase"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.length > 4 && (
                      <span className="px-2 py-1 rounded bg-bg-page border border-border-default text-[10px] font-mono text-text-muted font-bold">
                        +{project.tech_stack.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Progress & Member metrics */}
                  <div className="space-y-3 pt-4 border-t border-border-default text-[10px] text-text-muted font-mono uppercase tracking-wider font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>{projectMemberCount || 1} Contributors</span>
                      </span>
                      <span>{taskPct}% Tasks Done</span>
                    </div>

                    <div className="w-full h-1.5 bg-[#1A2333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-teal rounded-full transition-all"
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 bg-bg-surface/50 border-t border-border-default flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {project.github_repo_url && (
                      <a
                        href={project.github_repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-bg-page hover:bg-bg-surface text-text-muted hover:text-text-primary border border-border-default transition-colors"
                        title="View GitHub Repository"
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    )}
                    {project.live_demo_url && (
                      <a
                        href={project.live_demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-bg-page hover:bg-bg-surface text-text-muted hover:text-accent-teal border border-border-default transition-colors"
                        title="Open Live Application"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={() => setSelectedProject(project)}
                    variant="outline"
                    className="font-sans text-xs font-bold min-h-[36px] px-4 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer gap-2"
                  >
                    <span>Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Project Workspace Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-border-default flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent-teal/10 rounded-xl">
                    <FolderGit2 className="w-6 h-6 text-accent-teal" />
                  </div>
                  <h2 className="text-2xl font-black font-sans text-text-primary">
                    {selectedProject.title}
                  </h2>
                  <span
                    className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded uppercase tracking-wider border ${
                      selectedProject.status === 'active'
                        ? 'bg-status-success/15 text-status-success border-status-success/40'
                        : 'bg-bg-page text-text-muted border-border-default'
                    }`}
                  >
                    {selectedProject.status}
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-3 max-w-2xl font-sans font-medium leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-2.5 rounded-xl bg-bg-page hover:bg-bg-surface text-text-muted hover:text-text-primary transition-colors border border-border-default"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader Toolbar & Tabs */}
            <div className="px-8 py-4 bg-bg-surface/50 border-b border-border-default flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkspaceTab('board')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    workspaceTab === 'board'
                      ? 'bg-accent-teal text-on-accent shadow-md'
                      : 'bg-bg-page text-text-muted hover:text-text-primary border border-border-default'
                  }`}
                >
                  Task Board
                </button>
                <button
                  onClick={() => setWorkspaceTab('overview')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    workspaceTab === 'overview'
                      ? 'bg-accent-teal text-on-accent shadow-md'
                      : 'bg-bg-page text-text-muted hover:text-text-primary border border-border-default'
                  }`}
                >
                  Overview & Links
                </button>
                <button
                  onClick={() => setWorkspaceTab('team')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    workspaceTab === 'team'
                      ? 'bg-accent-teal text-on-accent shadow-md'
                      : 'bg-bg-page text-text-muted hover:text-text-primary border border-border-default'
                  }`}
                >
                  Team Roster ({projectMemberList.length || 1})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {selectedProject.github_repo_url && (
                  <a
                    href={selectedProject.github_repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-page hover:bg-bg-surface border border-border-default text-xs font-bold font-sans text-text-primary transition-colors"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>Repository</span>
                  </a>
                )}
                {selectedProject.live_demo_url && (
                  <a
                    href={selectedProject.live_demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 border border-accent-teal/30 text-xs font-bold font-sans text-accent-teal transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Live Demo</span>
                  </a>
                )}
                {profile && isActiveMember && (
                  isMemberOfSelected ? (
                    <Button
                      onClick={() => leaveProject(selectedProject.id)}
                      variant="outline"
                      className="font-sans text-xs font-bold min-h-[36px] px-4 rounded-xl text-status-destructive hover:text-white border-status-destructive/50 hover:bg-status-destructive transition-colors cursor-pointer"
                    >
                      Leave Team
                    </Button>
                  ) : (
                    <Button
                      onClick={() => joinProject(selectedProject.id)}
                      className="font-sans text-xs font-bold min-h-[36px] px-6 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-on-accent shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                    >
                      Join Project Team
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* TAB 1: KANBAN BOARD */}
              {workspaceTab === 'board' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-sans font-black text-white">
                        Sprint Board
                      </h3>
                      <p className="text-xs text-text-muted mt-1 font-sans">
                        Lightweight task tracking for shipping features and fixing bugs.
                      </p>
                    </div>

                    {(isMemberOfSelected || isStaff) && (
                      <Button
                        onClick={() => setIsNewTaskOpen(true)}
                        className="font-sans text-xs font-bold gap-2 bg-accent-teal hover:bg-accent-teal/90 text-on-accent min-h-[40px] px-5 rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Task</span>
                      </Button>
                    )}
                  </div>

                  {/* 4 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {taskColumns.map((col) => {
                      const colTasks = projectTasks.filter((t) => t.status === col.id)
                      return (
                        <div
                          key={col.id}
                          className="bg-bg-page border border-border-default rounded-2xl p-4 flex flex-col min-h-[360px]"
                        >
                          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-default">
                            <span className="text-xs font-bold font-sans text-text-primary uppercase tracking-wider">
                              {col.label}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-default font-bold">
                              {colTasks.length}
                            </span>
                          </div>

                          <div className="flex-1 space-y-3">
                            {colTasks.length === 0 ? (
                              <div className="h-32 flex items-center justify-center border border-dashed border-border-default rounded-xl text-xs font-sans font-medium text-text-muted">
                                No tasks
                              </div>
                            ) : (
                              colTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="p-4 bg-bg-surface border border-border-default hover:border-accent-teal/50 transition-colors rounded-xl shadow-sm space-y-3 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-bold font-sans text-text-primary line-clamp-2">
                                      {task.title}
                                    </span>
                                    {getPriorityBadge(task.priority)}
                                  </div>

                                  {task.description && (
                                    <p className="text-[11px] font-sans text-text-muted line-clamp-2 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                    <div className="pt-3 border-t border-border-default/60 flex items-center justify-between text-[11px] font-sans font-medium">
                                      <div className="flex items-center gap-1.5">
                                        {/* Move Left */}
                                        {col.id !== 'todo' && (
                                          <button
                                            onClick={() => {
                                              const prev =
                                                col.id === 'completed'
                                                  ? 'review'
                                                  : col.id === 'review'
                                                  ? 'in_progress'
                                                  : 'todo'
                                              updateTaskStatus(task.id, prev)
                                            }}
                                            className="p-1.5 rounded-lg bg-bg-page hover:bg-bg-surface text-text-muted hover:text-text-primary transition-colors border border-transparent hover:border-border-default"
                                            title="Move left"
                                          >
                                            <ArrowLeft className="w-3 h-3" />
                                          </button>
                                        )}
                                        {/* Move Right */}
                                        {col.id !== 'completed' && (
                                          <button
                                            onClick={() => {
                                              const next =
                                                col.id === 'todo'
                                                  ? 'in_progress'
                                                  : col.id === 'in_progress'
                                                  ? 'review'
                                                  : 'completed'
                                              updateTaskStatus(task.id, next)
                                            }}
                                            className="p-1.5 rounded-lg bg-bg-page hover:bg-bg-surface text-text-muted hover:text-accent-teal transition-colors border border-transparent hover:border-border-default"
                                            title="Move right"
                                          >
                                            <ArrowRight className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>

                                      {(isMemberOfSelected || isStaff) && (
                                      <button
                                        onClick={() => deleteTask(task.id)}
                                        className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                                        title="Delete task"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: OVERVIEW & TECH STACK */}
              {workspaceTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                    <div className="bg-bg-page p-6 rounded-3xl border border-border-default shadow-xl space-y-4">
                      <h4 className="text-xs font-bold font-mono uppercase text-text-muted tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-accent-purple" />
                        Project Overview
                      </h4>
                      <p className="text-sm font-sans font-medium text-text-primary leading-relaxed">
                        {selectedProject.description}
                      </p>
                    </div>

                    <div className="bg-bg-page p-6 rounded-3xl border border-border-default shadow-xl space-y-4">
                      <h4 className="text-xs font-bold font-mono uppercase text-text-muted tracking-wider flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-accent-teal" />
                        Engineering Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedProject.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-4 py-2 rounded-xl bg-bg-surface border border-border-default text-xs font-bold font-mono text-accent-teal uppercase tracking-wider"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-bg-page p-6 rounded-3xl border border-border-default shadow-xl space-y-4">
                      <h4 className="text-xs font-bold font-mono uppercase text-text-muted tracking-wider">
                        Quick Information
                      </h4>
                      <div className="space-y-4 text-xs font-mono font-bold text-text-muted uppercase tracking-wider">
                        <div className="flex justify-between items-center bg-bg-surface p-3 rounded-xl border border-border-default">
                          <span>Status</span>
                          <span className="text-status-success">{selectedProject.status}</span>
                        </div>
                        <div className="flex justify-between items-center bg-bg-surface p-3 rounded-xl border border-border-default">
                          <span>Created</span>
                          <span className="text-text-primary">
                            {new Date(selectedProject.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-bg-surface p-3 rounded-xl border border-border-default">
                          <span>Total Tasks</span>
                          <span className="text-text-primary">{projectTasks.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TEAM ROSTER */}
              {workspaceTab === 'team' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black font-sans text-white">
                        Project Contributors
                      </h4>
                      <p className="text-xs font-sans font-medium text-text-muted mt-1">
                        Active Dev Mates and staff collaborating on this codebase.
                      </p>
                    </div>

                    {profile && isActiveMember && !isMemberOfSelected && (
                      <Button
                        onClick={() => joinProject(selectedProject.id)}
                        className="font-sans text-xs font-bold min-h-[40px] px-5 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-on-accent shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                      >
                        Join Team
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {projectMemberList.map((m) => (
                      <div
                        key={m.id}
                        className="p-5 rounded-3xl bg-bg-page border border-border-default shadow-xl flex flex-col sm:flex-row items-center sm:justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#1A2333] flex items-center justify-center text-sm font-black font-sans text-accent-teal border border-border-default shadow-inner">
                            {(m.profile?.full_name || 'DM').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-black font-sans text-text-primary">
                              {m.profile?.full_name || 'Dev Mate'}
                            </div>
                            <div className="text-[10px] font-bold font-mono text-text-muted uppercase tracking-wider mt-0.5">
                              Joined {new Date(m.joined_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded uppercase tracking-wider border ${
                            m.role === 'lead'
                              ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/40'
                              : 'bg-bg-surface text-text-muted border-border-default'
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-purple/10 rounded-lg">
                   <FolderGit2 className="w-5 h-5 text-accent-purple" />
                 </div>
                <span>Initialize Software Project</span>
              </h3>
              <button
                onClick={() => setIsNewProjectOpen(false)}
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

            <form onSubmit={handleCreateProject} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MITE Campus Bus Tracker"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly state the engineering problem and architecture..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, TypeScript, FastAPI, PostgreSQL"
                  value={newStack}
                  onChange={(e) => setNewStack(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">GitHub URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={newGithub}
                    onChange={(e) => setNewGithub(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Live Demo URL</label>
                  <input
                    type="url"
                    placeholder="https://app.vercel.app"
                    value={newDemo}
                    onChange={(e) => setNewDemo(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-sans text-xs font-bold gap-2 bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  {isSubmitting ? 'Creating...' : 'Initialize Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-teal/10 rounded-lg">
                   <PlusCircle className="w-5 h-5 text-accent-teal" />
                 </div>
                <span>Create Task</span>
              </h3>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Supabase auth trigger"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key acceptance criteria..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-teal focus:outline-none transition-all font-mono text-xs uppercase tracking-wider appearance-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="font-sans text-xs font-bold bg-accent-teal hover:bg-accent-teal/90 text-on-accent min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
