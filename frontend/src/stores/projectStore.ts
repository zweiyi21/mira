import { create } from 'zustand'
import type { Project, Sprint, Issue, ProjectMember } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  sprints: Sprint[]
  currentSprint: Sprint | null
  issues: Issue[]
  members: ProjectMember[]
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setSprints: (sprints: Sprint[]) => void
  setCurrentSprint: (sprint: Sprint | null) => void
  setIssues: (issues: Issue[]) => void
  updateIssue: (issue: Issue) => void
  addIssue: (issue: Issue) => void
  removeIssue: (key: string) => void
  setMembers: (members: ProjectMember[]) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  sprints: [],
  currentSprint: null,
  issues: [],
  members: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setSprints: (sprints) => set({ sprints }),
  setCurrentSprint: (sprint) => set({ currentSprint: sprint }),
  setIssues: (issues) => set({ issues }),
  updateIssue: (issue) =>
    set((state) => ({
      issues: state.issues.map((i) => (i.key === issue.key ? issue : i)),
    })),
  addIssue: (issue) =>
    set((state) => ({
      issues: [...state.issues, issue],
    })),
  removeIssue: (key) =>
    set((state) => ({
      issues: state.issues.filter((i) => i.key !== key),
    })),
  setMembers: (members) => set({ members }),
}))
