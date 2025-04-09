// File: @/store/projectsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Project = {
    id: number
    description: string
}

type ProjectsStore = {
    projects: Project[]
    setProjects: (projects: Project[]) => void
    addProject: (project: Project) => void
    clearProjects: () => void
}

export const useProjectsStore = create<ProjectsStore>()(
    persist(
        (set) => ({
            projects: [],
            setProjects: (projects) => set({ projects }),
            addProject: (project) => set((state) => ({
                projects: [...state.projects, project]
            })),
            clearProjects: () => set({ projects: [] })
        }),
        {
            name: 'projects-storage', // name of the localStorage key
            partialize: (state) => ({ projects: state.projects }), // only persist the projects array
        }
    )
)