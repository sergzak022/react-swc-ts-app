import { faker } from '@faker-js/faker'
import { range, pick } from 'lodash'
import { Project, NewProject, User } from "@components";

interface CreateUserProps {
  id ?: number;
  projectCount: number;
  name?: string;
  email?: string;
}

interface APIUser extends User {
  projects: Array<Project>
}

export let users: Array<APIUser> = []
export let projects: Array<Project> = []

export function convertAPIUserToUser(apiUser: APIUser) : User {
  return pick(apiUser, ['id', 'email', 'name'])
}


// NOTE: updated in place
const projectIDToUserMap: {[projectId: string]: APIUser} = {}

function getFakeProjects(id: number) : Project {
  return {
    id,
    name: faker.company.name()
  };
}

export function seedUsers(count: number) {
  range(users.length, users.length + count).forEach( id => {
    createUser({id, projectCount: 5})
  })
}

export function createUser( props : CreateUserProps ) {
  const {
    id, projectCount, name, email
  } = props

  const newProjects = range(projects.length, projects.length + projectCount).map(getFakeProjects)

  const user = {
    id: id != null ? id : users.length,
    email: email || faker.internet.email(),
    name: name || faker.name.fullName(),
    projects: newProjects
  }

  projects = [...projects, ...newProjects]

  newProjects.forEach( p => {
    projectIDToUserMap[p.id] = user
  })

  users = [...users, user]

  return user
}


function replaceArrEl<T>(
  arr: Array<T>,
  el: T,
  predicate: (el: T) => boolean
) : Array<T> {

  const elIdx = arr.findIndex(predicate)

  return [
    ...arr.slice(0, elIdx),
    el,
    ...arr.slice(elIdx + 1),
  ]
}

interface UpdateUserData {
  id: number
  email: string
  name: string
}

export function updateUser(userData: UpdateUserData) {

  const userId = userData.id

  const user = users.find( u => u.id === userId )
  const updatedUser = {...user, ...userData} as APIUser

  users = replaceArrEl(users, updatedUser, u => u.id !== userId)

  return updatedUser
}

export function deleteUser( userId: number ) : boolean {
  const user = users.find( u => u.id === userId )

  users = users.filter( u => u.id !== userId )

  if (user) {
    const projectIdsToRemove = user.projects.map(p => p.id)
    projects = projects.filter( u => !projectIdsToRemove.includes(u.id) )
  }

  return true
}

export function resetUsers() {
  users = []
  projects = []
}

export function getUserById(id: number) {
  return users.find(u => u.id === id)
}

export function getProjectById(id: number) {
  return projects.find(u => u.id === id)
}

export function updateProject(project: Project) {

  const projectId = project.id

  projects = replaceArrEl(projects, project, p => p.id !== projectId)

  const user = projectIDToUserMap[projectId]

  if ( user ) {

    const updatedUser = {
      ...user,
      projects: replaceArrEl(user.projects, project, p => p.id !== projectId)
    }

    users = replaceArrEl(users, updatedUser, u => u.id === updatedUser.id)
  }

  return project
}

export function createProject(
  userId: number,
  project: NewProject
) {
  const user = getUserById(userId)
  let newProject
  if (user) {
    newProject = {...project, id: projects.length}
    user.projects = [...user.projects, newProject]
    projects = [...projects, newProject]
  }
  return newProject
}

export function deleteProject( projectId: number ) {
  const origProjects = projects

  projects = projects.filter((p) => p.id !== projectId)

  const user = projectIDToUserMap[projectId]
  let origUserProjects
  let hasDeletedProjectFromUser = false
  if ( user ) {
    origUserProjects = user.projects
    const userIdx = users.indexOf(user)
    users = [
      ...users.slice(0, userIdx),
      {
        ...user,
        projects: user.projects.filter((p) => p.id !== projectId)
      },
      ...users.slice(userIdx + 1),
    ]

    hasDeletedProjectFromUser = users[userIdx]?.projects.length < origUserProjects.length
  }


  return origProjects.length > projects.length
    && hasDeletedProjectFromUser
}
