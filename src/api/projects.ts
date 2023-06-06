//import { faker } from '@faker-js/faker'
//import { range } from 'lodash'
import { Project, NewProject } from "@components/Projects";

export function fetchProjects(userID: number) : Promise<Project[]> {
  return fetch(`/api/users/${userID}/projects`)
    .then(res => res.json())
}

export function updateProject(project: Project) : Promise<Project> {
  return fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    })
    .then(res => res.json())
}

export function createProject(
    userID: number,
    project: NewProject
) : Promise<Project> {
  return fetch(`/api/users/${userID}/projects`, {
      method: 'POST',
      body: JSON.stringify(project)
    })
    .then(res => res.json())
}

export function deleteProject(id: number) : Promise<Response> {
  return fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    })
}
