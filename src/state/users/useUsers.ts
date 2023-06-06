import { useCallback, useMemo, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { User, NewUser } from "@components";
import * as usersAPI from '@api/users';
import { updateArrayValue } from '@utils'

const DEFAULT_USERS_LIST: Array<User>= []

export function useUsers( passedUsers: Array<User> = DEFAULT_USERS_LIST ) {

  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  const usersAtom = useMemo(() => {
    return atom<User[]>(passedUsers)
  }, [passedUsers])

  const [users, setUsers] = useAtom(usersAtom)

  const fetchUsers = useCallback(() => {

    let isDestroyed = false;

    usersAPI.fetchUsers().then((users: Array<User>) => {
      !isDestroyed && setUsers(users);
    })

    return () => {
      isDestroyed = true;
    }

  }, [setUsers]);


  const updateUser = useCallback((user: User) => {
    const {id} = user;

    usersAPI.updateUser(user).then((updatedUser) => {
      const newUsers = updateArrayValue(users, updatedUser, (u) => u.id === id)
      setUsers(newUsers)
    }).catch((err) => {
      console.error('Could not update user', user, err)
    })

  }, [users, setUsers])


  const createUser = useCallback((newUser: NewUser) => {

    usersAPI.createUser(newUser).then((user) => {
      const newUsers = [...users, user]
      setUsers(newUsers)
    }).catch((err) => {
      console.error('Could not create user', newUser, err)
    })

  }, [users, setUsers])

  const deleteUser = useCallback((id: number) => {

    usersAPI.deleteUser(id).then(() => {
      const newUsers = users.filter( u => u.id !== id )
      setUsers(newUsers)
    }).catch((err) => {
      console.error('Could not delete user with id', id, err)
    })

  }, [users, setUsers])

  const getUserById = useCallback((id: number) => {
    return users.find( u => u.id === id )
  }, [users]);

  return useMemo(
    () => ({
      users,
      fetchUsers,
      updateUser,
      createUser,
      deleteUser,
      getUserById,
      selectedUser,
      setSelectedUser,
    }),
    [
      users,
      fetchUsers,
      updateUser,
      createUser,
      deleteUser,
      getUserById,
      selectedUser,
      setSelectedUser,
    ]
  )
}
