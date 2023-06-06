import { renderHook, act } from '@testing-library/react'
import { useProjects } from './useProjects'
import { getProjectList } from "@utils";
import * as server from '../../mocks/server'

beforeAll(() => {
  server.start()
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers()
  server.resetState()
})

afterAll(() => server.stop())


test('should have empty projects array by default', () => {
  const { result: {current} } =  renderHook( () => useProjects() )
  const { projects } = current;
  expect( projects.length ).toBe(0);
})

test('should have non-empty projects array if passed', () => {
  const projectList = getProjectList();
  const { result: {current} } =  renderHook( () => useProjects(projectList) )
  const { projects } = current;
  expect( projects.length ).toBe(projectList.length)
})

test('should have non-empty projects array after fetchProjects is called', async () => {
  const userID = 1;
  server.data.createUser({id: userID, projectCount: 3})

  const res =  renderHook( () => useProjects() )
  const { result } =  res
  const { current } =  result

  const waitingForResponse$ = server.waitForResponse()

  // NOTE: use async act call to wait for
  // Promose.prototype.resolve to resolve
  await act(async () => {
    current.fetchProjects(userID)

    return waitingForResponse$
  })

  // NOTE: have to pull values from result each time hook is updated
  // this is because result.current is not updated in place, but replaced
  // on each update
  const { current: {projects} } =  result

  expect(projects.length).toBeGreaterThan(0);
})

test('updateProject should update user in users', async () => {
  const {projects} = server.data.createUser({id: 0, projectCount: 3})

  const updatedProject = { ...projects[0], name: 'foobar' }
  const res =  renderHook( () => useProjects(projects) )
  const { result } =  res

  const waitingForResponse$ = server.waitForResponse()

  // NOTE: not using async act call cause
  // updateProject is sync operation
  await act( async() => {
    result.current.updateProject(updatedProject)
    return waitingForResponse$
  })

  // NOTE: have to pull values from result each time hook is updated
  // this is because result.current is not updated in place, but replaced
  // on each update
  expect(result.current.getProjectById(updatedProject.id)).toEqual(updatedProject)
})

test('createProject should add project to projects', async () => {

  const {id, projects} = server.data.createUser({id: 0, projectCount: 0})

  const newProject = {name: 'foobar'}

  const res =  renderHook( () => {
    return useProjects(projects, id)
  })
  const { result } =  res

  const waitingForResponse$ = server.waitForResponse()

  await act( async() => {
    result.current.createProject(newProject)
    return waitingForResponse$
  })

  expect(result.current.projects.length).toBe(1)
})

test('deleteProject should remove project from projects', async () => {

  const {projects} = server.data.createUser({id: 0, projectCount: 1})

  const deleteProjectAtIdx = 0;

  const res =  renderHook( () => useProjects(projects) )
  const { result } =  res

  const waitingForResponse$ = server.waitForResponse()

  await act( async() => {
    result.current.deleteProject(projects[deleteProjectAtIdx])
    return waitingForResponse$
  })

  expect(result.current.projects.length).toBeLessThan(projects.length)
})
