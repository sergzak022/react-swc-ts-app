import { useCallback, useState, useMemo } from 'react'
import { Project, NewProject } from "@components/Projects";
import { atom, useAtom } from 'jotai'
import * as projectsAPI from '@api/projects';
import { updateArrayValue } from '@utils/array'

const DEFAULT_PROJECTS_LIST: Array<Project>= []

export function useProjects(
  passedProjects: Array<Project> = DEFAULT_PROJECTS_LIST,
  passedUserID?: number
) {

  const [userID, setUserID] = useState<number | undefined>(passedUserID);
  const projectsAtom = useMemo(() => {
    return atom<Project[]>(passedProjects)
  }, [passedProjects])

  const [projects, setProjects] = useAtom(projectsAtom)

  const fetchProjects = useCallback( ( userID: number ) => {

    let isDestroyed = false

    projectsAPI.fetchProjects(userID).then((projects: Array<Project>) => {
      if (!isDestroyed) {
        setProjects(projects)
        setUserID(userID)
      }
    }).catch((err) => { // WHAT IS THE TYPE OF THE ERR?
      console.error('Could not fetch projects', err)
    })

    return () => {
      isDestroyed = true;
    }

  }, [setProjects, setUserID])

  const updateProject = useCallback((project: Project) => {
      projectsAPI.updateProject(project).then((projectFromServer: Project) => {
        const {id} = projectFromServer;
        const newProjects = updateArrayValue(projects, projectFromServer, p => p.id === id)
        setProjects(newProjects)
      }).catch(err => {
          console.error('Could not update project', err)
      })
  }, [projects, setProjects])

  const getProjectById = useCallback((id: number) => {
    return projects.find( p => p.id === id )
  }, [projects]);

  const createProject = useCallback((newProject: NewProject) => {
    if ( userID == null ) {
      throw new Error('useProject.createProject: userID is not defiend')
    }
    projectsAPI.createProject(userID, newProject)
      .then((projectFromServer: Project) => {
        const newProjects = [...projects, projectFromServer]
        setProjects(newProjects)
      }).catch(err => {
          console.error('Could not update project', err)
      })
  }, [userID, projects, setProjects])


  const deleteProject = useCallback((project: Project) => {
    const {id} = project;
    projectsAPI.deleteProject(id)
      .then(() => {
        const newProjects = projects.filter( p => p.id !== id );
        setProjects(newProjects);
      }).catch(err => {
          console.error('Could not delete project', err)
      })



  }, [projects, setProjects]);

  return useMemo(
    () => ({
      userID,
      fetchProjects,
      projects,
      getProjectById,
      updateProject,
      createProject,
      deleteProject,
    }),
    [
      userID,
      fetchProjects,
      projects,
      getProjectById,
      updateProject,
      createProject,
      deleteProject,
    ]
  )
}
