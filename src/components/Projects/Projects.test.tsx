import {
  render, screen, within, fireEvent
} from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Projects, ProjectsProps, Project
} from './Projects';
import {
  PROJECT_LIST_ITEM_ID, PROJECT_NAME_INPUT_ID, PROJECT_DELETE_BTN_ID,
  PROJECT_SELECT_BTN_ID, PROJECT_SELECTION_ID, PROJECT_NEW_NAME_INPUT_ID,
  PROJECT_NEW_BTN,
} from './constants';

const getProjectList = () => ([
  {id: 0, name: 'foo'},
  {id: 1, name: 'bar'},
  {id: 2, name: 'baz'}
])

let props: ProjectsProps;
let projects: Array<Project> = []

beforeEach(() => {
  projects = getProjectList()

  props = {
    projects,
    onProjectChange: jest.fn(),
    onProjectCreate: jest.fn(),
    onProjectDelete: jest.fn(),
    onProjectSelectBtnClick: jest.fn(),
  }
})

test('should match snapshot', () => {
  const tree = render(<Projects {...props} />)
  expect(tree).toMatchSnapshot()
})

test('should render empty list of projects if empty projects list passed', () => {
  render(<Projects projects={[]}/>)

  const projectList = screen.queryAllByTestId(PROJECT_LIST_ITEM_ID)
  expect(projectList.length).toBe(0)
})

test('should render non-empty list of projects passed', () => {
  render(<Projects {...props}/>)

  const projectList = screen.getAllByTestId(PROJECT_LIST_ITEM_ID)
  expect(projectList.length).toBe(projects.length)
})

test('should call onProjectChange if name changed', () => {

  const updateIdx = 1;
  const newProject = {...projects[updateIdx], name: 'kot'}

  render(<Projects {...props}/>)

  const projectNameInputs = screen.getAllByTestId(PROJECT_NAME_INPUT_ID)

  fireEvent.change(projectNameInputs[updateIdx], { target: { value: 'kot' } })

  expect(props.onProjectChange).toHaveBeenCalledTimes(1)
  expect(props.onProjectChange).toHaveBeenCalledWith(newProject)
})


test('should call onProjectDelete if delete btn clicked', () => {
  const deleteIdx = 1;
  const projectToDelete = props.projects[deleteIdx];

  render(<Projects {...props}/>)

  const projectList = screen.getAllByTestId(PROJECT_LIST_ITEM_ID)

  const deleteBtnFor2ndProject = within(projectList[deleteIdx]).getByTestId(PROJECT_DELETE_BTN_ID)

  fireEvent.click(deleteBtnFor2ndProject)

  expect(props.onProjectDelete).toHaveBeenCalledTimes(1)
  expect(props.onProjectDelete).toHaveBeenCalledWith(projectToDelete)
})

test('should mark selected project row if selectedProject prop set', () => {
  const selectIdx = 1;

  const updatedProps = {
    ...props,
    selectedProject: props.projects[selectIdx]
  }

  render(<Projects {...updatedProps}/>)

  const projectList = screen.getAllByTestId(PROJECT_LIST_ITEM_ID)

  const selectMarkFor2ndProject = within(projectList[selectIdx]).getByTestId(PROJECT_SELECTION_ID)

  expect(selectMarkFor2ndProject).toBeTruthy()

})

test('should call onProjectSelectBtnClick when click on select btn', () => {
  const selectIdx = 1;
  const projectToSelect = props.projects[selectIdx];

  render(<Projects {...props}/>)

  const projectList = screen.getAllByTestId(PROJECT_LIST_ITEM_ID)

  const selectBtnFor2ndProject = within(projectList[selectIdx]).getByTestId(PROJECT_SELECT_BTN_ID)

  fireEvent.click(selectBtnFor2ndProject)

  expect(props.onProjectSelectBtnClick).toHaveBeenCalledTimes(1)
  expect(props.onProjectSelectBtnClick).toHaveBeenCalledWith(projectToSelect)
})

test('should call onProjectCreate if create btn clicked', () => {
  render(<Projects {...props}/>)

  const newProjectNameInput = screen.getByTestId(PROJECT_NEW_NAME_INPUT_ID)
  const newProjectBtn = screen.getByTestId(PROJECT_NEW_BTN)

  const newProject = {
    name: 'new project'
  }

  fireEvent.change(newProjectNameInput, { target: { value: newProject.name } })
  fireEvent.click(newProjectBtn)

  expect(props.onProjectCreate).toHaveBeenCalledTimes(1)
  expect(props.onProjectCreate).toHaveBeenCalledWith(newProject)
})
