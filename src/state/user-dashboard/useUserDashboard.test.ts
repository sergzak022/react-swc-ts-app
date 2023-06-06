import { renderHook, act } from '@testing-library/react'
import { useUserDashboard } from "./useUserDashboard";
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

test('Should have no users and no projects by default', () => {
  const { result } =  renderHook( () => useUserDashboard() )
  const { current } = result

  expect(current.useUsers.users.length).toBe(0)
  expect(current.useProjects.projects.length).toBe(0)
})

test('When user is not selected should not have projects', async () => {
  const user = server.data.createUser({projectCount: 3})
  const users = [user]

  const { result } =  renderHook( () => useUserDashboard() )
  let current = result.current
  const waitingForResponse$ = server.waitForResponse()

  // NOTE: use async act call to wait for
  // Promose.prototype.resolve to resolve
  await act(async () => {
    current.useUsers.fetchUsers()
    return waitingForResponse$
  })

  current = result.current

  expect(current.useUsers.users.length).toBe(users.length)
  expect(current.useUsers.selectedUser).toBeUndefined()
  expect(current.useProjects.projects.length).toBe(0)
})

test('When user is selected should have projects', async () => {
  const selectedUserIdx = 0
  const user = server.data.createUser({projectCount: 3})
  const users = [user]

  const { result } =  renderHook( () => useUserDashboard() )
  let current = result.current

  const waitingForFetchUsers$ = server.waitForResponse()

  // NOTE: use async act call to wait for
  // Promose.prototype.resolve to resolve
  await act(async () => {
    current.useUsers.fetchUsers()
    return waitingForFetchUsers$
  })

  current = result.current

  const waitingForFetchProjects$ = server.waitForResponse()
  // NOTE: using this act to call setSelectedUser and wait for all hooks to resolve
  act(() => {
    // NOTE: pulling selected user from useUsers.users array
    // because userList has different references
    const selectedUser = current.useUsers.users[selectedUserIdx]
    current.useUsers.setSelectedUser(selectedUser)
  })

  await act(async () => {
    return waitingForFetchProjects$
  })

  current = result.current

  expect(current.useUsers.users.length).toBe(users.length)
  expect(current.useUsers.selectedUser).toBeDefined()
  expect(current.useProjects.projects.length).toBe(3)
})

// 1. When selectedUser is set should call fetchProjects
// to set selectedUser need to
//  - call useUsers.fetchUsers
//  - call useUsers.setSelectedUser
// check if useProjects.projects has length
