import { renderHook, act } from '@testing-library/react'
import { useUsers } from './useUsers'
import * as server from '../../mocks/server'

beforeAll(() => {
  server.start()
  jest.restoreAllMocks()
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers()
  server.resetState()
})

afterAll(() => server.stop())

test('users should be an empty array if no users passed as an arg', () => {
  const { result: {current} } =  renderHook( () => useUsers() )
  const {users} = current;
  expect(users.length).toBe(0);
})

test('users should be non empty array if users passed as an arg', () => {
  const usersList = [{id: 0, name: 'foo', email: 'foo@gmail.com'}]
  const { result: {current} } =  renderHook( () => useUsers(usersList) )
  const {users} = current;
  expect(users.length).toBe(usersList?.length);
})

test('users should be non empty array after fetchUsers is called', async () => {

  server.data.createUser({projectCount: 0})

  const res =  renderHook( () => useUsers() )
  const { result } =  res
  const { current } =  result

  const waitingForResponse$ = server.waitForResponse()

  // NOTE: use async act call to wait for
  // Promose.prototype.resolve to resolve
  await act(async () => {
    current.fetchUsers()
    await waitingForResponse$
  })

  // NOTE: have to pull values from result each time hook is updated
  // this is because result.current is not updated in place, but replaced
  // on each update
  const { current: {users} } =  result

  expect(users.length).toBeGreaterThan(0);
})

test('updateUser should update user in users', async () => {
  const userID = 0
  const user = server.data.createUser({id: userID, projectCount: 0})
  const users = [user]

  const updatedUser = {id: userID, name: 'foobar', email: 'foobar@gmail.com'}
  const res =  renderHook( () => useUsers(users) )
  const { result } =  res

  const waitingForResponse$ = server.waitForResponse()

  // NOTE: using async act call cause
  // updateUser is async operation
  await act( async () => {
    result.current.updateUser(updatedUser)
    await waitingForResponse$
  })

  // NOTE: have to pull values from result each time hook is updated
  // this is because result.current is not updated in place, but replaced
  // on each update
  expect(result.current.getUserById(updatedUser.id)).toEqual(updatedUser)
})

test('createUser should add user to users', async () => {
  const newUser = {name: 'foobar', email: 'foobar@gmail.com'}

  const res =  renderHook( () => useUsers() )
  const { result } =  res

  const waitingForResponse$ = server.waitForResponse()

  // NOTE: using async act call cause
  // createUser is async operation
  await act( async () => {
    result.current.createUser(newUser)
    await waitingForResponse$
  })

  expect(result.current.users.length).toBe(1)
})

test('deleteUser should remove user from users', async () => {
  const deleteUserId = 1;
  const user = server.data.createUser({id: deleteUserId, projectCount: 0})
  const users = [user]
  const res =  renderHook( () => useUsers(users) )
  const { result } =  res

  const waitingForResponse$ = server.waitForResponse()

  // NOTE: using async act call cause
  // deleteUser is async operation
  await act( async () => {
    result.current.deleteUser(deleteUserId)
    await waitingForResponse$
  })

  expect(result.current.users.length).toBeLessThan(users.length)
})
