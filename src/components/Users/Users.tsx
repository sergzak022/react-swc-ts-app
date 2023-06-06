import {
  SyntheticEvent, useMemo, useState,
  useCallback,
} from 'react';

export interface NewUser {
  email: string;
  name: string;
}

export interface User extends NewUser {
  id: number;
}


export interface UsersProps {
  users: Array<User>
  onUserChange: (u: User) => void
  onUserCreate: (u: NewUser) => void
  onUserDelete: (id: number) => void
  selectedUser?: User
  onUserSelectBtnClick?: ( u: User ) => void
}

const EMPTY_NEW_USER = {email: '', name: ''};

export function Users (props: UsersProps) {
  const {
    users,
    onUserChange,
    onUserCreate,
    onUserDelete,
    selectedUser,
    onUserSelectBtnClick,
  } = props;

  const [newUser, setNewUser] = useState<NewUser>(EMPTY_NEW_USER);

  const onEmailChange = useCallback(
    function (e: SyntheticEvent<HTMLInputElement>, user: User) {
      const {currentTarget: {value}} = e;
      onUserChange({...user, email: value})
    },
    [onUserChange]
  )

  const onNameChange = useCallback(
    function (e: SyntheticEvent<HTMLInputElement>, user: User) {
      const {currentTarget: {value}} = e;
      onUserChange({...user, name: value})
    },
    [onUserChange]
  )

  const onCreate = useCallback(
    function (newUser: NewUser) {
      onUserCreate(newUser);
      setNewUser(EMPTY_NEW_USER);
    },
    [onUserCreate]
  )

  const usersList =  useMemo(() => {
    return users.map((user) => {
      const { id, email, name } = user;
      const isSelected = user === selectedUser

      return (
        <li data-testid="User" key={id}>
          <div>
            {isSelected && <span data-testid="User-selection">*</span>}
            <span data-testid="User-email">{email}</span>
            {' '} | {' '}
            <span data-testid="User-name">{name}</span>
          </div>
          <div>
            <label>
              Chage Email: 
              <input
                data-testid="User-email-input"
                onChange={(e) => onEmailChange(e, user)} value={email}
              />
            </label>
            <label>
              Chage name: 
              <input
                data-testid="User-name-input"
                onChange={(e) => onNameChange(e, user)} value={name}
              />
            </label>
            <label>
              <button
                data-testid="User-delete"
                onClick={() => onUserDelete(id)}
              >Delete</button>
              <button
                data-testid="User-select"
                onClick={
                  () =>
                    typeof onUserSelectBtnClick === 'function'
                      && onUserSelectBtnClick(user)
                }
              >Select</button>
            </label>
          </div>
        </li>
      )
    });
  }, [users, selectedUser, onEmailChange, onNameChange, onUserDelete, onUserSelectBtnClick])

  const { email, name } = newUser;

  return (
    <div>
      <div>
        <div>Create User</div>
        <label>
          <span>Email: </span>
          <input
            data-testid="User-new-email-input"
            onChange={({currentTarget: {value}}: SyntheticEvent<HTMLInputElement>) => setNewUser({email: value, name})}
            value={email}
          />
        </label>
        <label>
          <span>Name: </span>
          <input
            data-testid="User-new-name-input"
            onChange={({currentTarget: {value}}: SyntheticEvent<HTMLInputElement>) => setNewUser({email, name: value})}
            value={name}
          />
        </label>
        <label>
          <button
            data-testid="User-new-btn"
            disabled={email.length === 0 || name.length === 0}
            onClick={() => onCreate(newUser)}
          >Create</button>
        </label>
      </div>
      <ul data-testid="Users-list">
        {usersList}
      </ul>
    </div>
  )
}
