import { User, NewUser } from "@components/Users";

export function fetchUsers() : Promise<User[]> {
  return fetch('/api/users')
    .then(res => res.json())
}

export function updateUser(user: User) : Promise<User> {
  return fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    })
    .then(res => res.json())
}

export function createUser(user: NewUser) : Promise<User> {
  return fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user)
    })
    .then(res => res.json())
}

export function deleteUser(id: number) : Promise<Response> {
  return fetch(`/api/users/${id}`, {
      method: 'DELETE'
    })
}
