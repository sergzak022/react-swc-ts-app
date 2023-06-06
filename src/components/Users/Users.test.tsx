import {
  render, screen, within, fireEvent
} from '@testing-library/react'
import '@testing-library/jest-dom'
import { Users, UsersProps } from './Users';

// TODO: use these constants in the component, so it easy to
// change values in the future
const USER_LIST_ITEM_ID = 'User'
const USER_EMAIL_ID = 'User-email'
const USER_NAME_ID = 'User-name'
const USER_EMAIL_INPUT_ID = 'User-email-input'
const USER_NAME_INPUT_ID = 'User-name-input'
const USER_DELETE_ID = 'User-delete'
const USER_SELECT_BTN_ID = 'User-select'
const USER_SELECTION_ID = 'User-selection'

const USER_NEW_EMAIL_INPUT_ID = 'User-new-email-input'
const USER_NEW_NAME_INPUT_ID = 'User-new-name-input'
const USER_NEW_BTN_ID = 'User-new-btn'


const getUserList = () => ([
  {id: 0, name: 'foo', email: 'foo@gmail.com'},
  {id: 1, name: 'bar', email: 'bar@gmail.com'},
  {id: 2, name: 'baz', email: 'baz@gmail.com'}
])

let props: UsersProps;

beforeEach(() => {
  const users = getUserList()

  props = {
    users,
    onUserChange: jest.fn(),
    onUserCreate: jest.fn(),
    onUserDelete: jest.fn(),
  }
})


test('should match snapshot', () => {
  const tree = render(<Users {...props} />)
  expect(tree).toMatchSnapshot()
})

test('should render non-empty list of users', async () => {
    render(<Users {...props} />)

    const usersList = screen.getAllByTestId(USER_LIST_ITEM_ID);
    expect(usersList.length).toEqual(3);
})

test('should render correct email for each users', async () => {
    render(<Users {...props} />)

    const usersList = screen.getAllByTestId(USER_LIST_ITEM_ID);
    const emails = usersList.map( userListEl => within(userListEl).getByTestId(USER_EMAIL_ID) )

    emails.forEach((email, idx) => expect(email).toHaveTextContent(props.users[idx].email));
})

test('should render correct name for each users', async () => {
    render(<Users {...props} />)

    const usersList = screen.getAllByTestId(USER_LIST_ITEM_ID);
    const emails = usersList.map( userListEl => within(userListEl).getByTestId(USER_NAME_ID) )

    emails.forEach((email, idx) => expect(email).toHaveTextContent(props.users[idx].name));
})

test('when change email should call onUserChange', async () => {
    render(<Users {...props} />)

    const emailInputList = screen.getAllByTestId(USER_EMAIL_INPUT_ID)

    emailInputList.forEach((emailInput, idx) => {
      fireEvent.change(emailInput, { target: { value: idx.toString() } })
    })

    const newUsers = props.users.map((user, idx) => ({
      ...user,
      email: idx.toString()
    }))

    const onUserChangeMock = props.onUserChange as jest.Mock;

    expect(props.onUserChange).toHaveBeenCalledTimes(3)

    onUserChangeMock.mock.calls.forEach(([ arg ], idx) => {
      expect(arg).toEqual(newUsers[idx])
    })
})

test('when change name should call onUserChange with right data', async () => {
    render(<Users {...props} />)

    const emailInputList = screen.getAllByTestId(USER_NAME_INPUT_ID)

    emailInputList.forEach((emailInput, idx) => {
      fireEvent.change(emailInput, { target: { value: idx.toString() } })
    })

    const newUsers = props.users.map((user, idx) => ({
      ...user,
      name: idx.toString()
    }))

    const onUserChangeMock = props.onUserChange as jest.Mock;

    expect(props.onUserChange).toHaveBeenCalledTimes(3)

    onUserChangeMock.mock.calls.forEach(([ arg ], idx) => {
      expect(arg).toEqual(newUsers[idx])
    })
})

test('when enter new user email, name and hit create button should call onUserCreate with right data', async () => {
  render(<Users {...props} />)

  const newUserEmailInput = screen.getByTestId(USER_NEW_EMAIL_INPUT_ID)
  const newUserNameInput = screen.getByTestId(USER_NEW_NAME_INPUT_ID)
  const newUserBtn = screen.getByTestId(USER_NEW_BTN_ID)

  const NewUser = {
    name: 'New Name',
    email: 'new@gmail.com',
  }

  fireEvent.change(newUserEmailInput, { target: { value: NewUser.email } })
  fireEvent.change(newUserNameInput, { target: { value: NewUser.name } })

  fireEvent.click(newUserBtn)

  expect(props.onUserCreate).toHaveBeenCalled();
  expect(props.onUserCreate).toHaveBeenCalledWith(NewUser);

})

test('when click delete btn should call onUserDelete', async () => {
  render(<Users {...props} />)

  const userDeleteBtns = screen.getAllByTestId(USER_DELETE_ID)

  userDeleteBtns.forEach((userDeleteBtn) => {
    fireEvent.click(userDeleteBtn)
  })

  expect(props.onUserDelete).toHaveBeenCalledTimes(props.users.length);
  expect(props.onUserDelete).toHaveBeenCalledWith(props.users[props.users.length - 1]?.id);

})

test('when selectedUser is set mark the selecte user row', () => {

  const selectedUserIdx = 1;
  const selectedUser = props.users[selectedUserIdx];

  const updatedProps = {
    ...props,
    selectedUser
  }

  render(<Users {...updatedProps} />)

  const userRows = screen.getAllByTestId(USER_LIST_ITEM_ID);

  const selectedUserRow = userRows.find( ( userRow ) => {
    return within(userRow).queryByTestId(USER_SELECTION_ID) != null
  })

  let selectedUserEmailEl,
      selectedUserNameEl,
      selectedRowIdx

  if (selectedUserRow) {
    selectedUserEmailEl = within(selectedUserRow).getByTestId(USER_EMAIL_ID)
    selectedUserNameEl = within(selectedUserRow).getByTestId(USER_NAME_ID)
    selectedRowIdx = userRows.indexOf(selectedUserRow)
  }

  expect(selectedRowIdx).toBe(selectedUserIdx)
  expect(selectedUserEmailEl).toHaveTextContent(selectedUser.email)
  expect(selectedUserNameEl).toHaveTextContent(selectedUser.name)

})

test('when selectedUser changes mark a differnt user row as selected', () => {
  // TODO
})

test('when select btn is clicked fire onUserSelectBtnClick', () => {

  const testUserIdx = 1;

  const updatedProps = {
    ...props,
    onUserSelectBtnClick: jest.fn(),
  }
  render(<Users {...updatedProps} />)

  const userRows = screen.getAllByTestId(USER_LIST_ITEM_ID)

  const secondUserSelectBtn = within(userRows[testUserIdx]).getByTestId(USER_SELECT_BTN_ID)

  fireEvent.click(secondUserSelectBtn)

  expect(updatedProps.onUserSelectBtnClick).toHaveBeenCalledWith(props.users[testUserIdx])
})
