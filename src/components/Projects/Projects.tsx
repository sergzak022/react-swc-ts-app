import {
  useMemo, useCallback, SyntheticEvent,
  useState,
} from 'react'
import {
  PROJECT_LIST_ITEM_ID, PROJECT_NAME_INPUT_ID, PROJECT_SELECTION_ID,
  PROJECT_NAME_ID, PROJECT_SELECT_BTN_ID, PROJECT_LIST_ID,
  PROJECT_DELETE_BTN_ID, PROJECT_NEW_NAME_INPUT_ID, PROJECT_NEW_BTN
} from './constants';

export interface NewProject {
  name: string
}

export interface Project extends NewProject {
  id: number
}

export interface ProjectsProps {
  projects : Array<Project>
  onProjectChange ?: (u: Project) => void
  onProjectCreate ?: (u: NewProject) => void
  onProjectDelete ?: (p: Project) => void
  selectedProject ?: Project
  onProjectSelectBtnClick ?: (p: Project) => void
}

const EMPTY_NEW_PROJECT = {name: ''};

export function Projects (props: ProjectsProps) {

  const {
    projects,
    onProjectChange,
    onProjectCreate,
    onProjectDelete,
    selectedProject,
    onProjectSelectBtnClick,
  } = props;

  const [newProject, setNewProject] = useState<NewProject>(EMPTY_NEW_PROJECT);

  const onNameChange = useCallback(
    function (e: SyntheticEvent<HTMLInputElement>, project: Project) {
      const {currentTarget: {value}} = e;

      if (typeof onProjectChange === 'function') {
        onProjectChange({...project, name: value})
      }

    },
    [onProjectChange]
  )

  const onCreate = useCallback(
    function (newProject: NewProject) {
      if (typeof onProjectCreate === 'function') {
        onProjectCreate(newProject);
        setNewProject(EMPTY_NEW_PROJECT);
      }
    },
    [onProjectCreate]
  )

  const projectsList =  useMemo(() => {
    return projects.map( project => {
      const { id, name } = project;
      const isSelected = project === selectedProject

      return (
        <li data-testid={PROJECT_LIST_ITEM_ID} key={id}>
          <div>
            {isSelected && <span data-testid={PROJECT_SELECTION_ID}>*</span>}
            <span data-testid={PROJECT_NAME_ID}>{name}</span>
          </div>
          <div>
            <label>
              Chage name:
              <input
                data-testid={PROJECT_NAME_INPUT_ID}
                onChange={(e) => onNameChange(e, project)} value={name}
              />
            </label>
            <label>
              <button
                data-testid={PROJECT_DELETE_BTN_ID}
                onClick={
                  () => typeof onProjectDelete === 'function'
                    && onProjectDelete(project)
                }
              >Delete</button>
              <button
                data-testid={PROJECT_SELECT_BTN_ID}
                onClick={
                  () =>
                    typeof onProjectSelectBtnClick === 'function'
                      && onProjectSelectBtnClick(project)
                }
              >Select</button>
            </label>
          </div>
        </li>
      )
    });
  }, [projects, selectedProject])

  return (
    <div>
      <div>
        <div>Create Project</div>
        <label>
          <span>Name: </span>
          <input
            data-testid={PROJECT_NEW_NAME_INPUT_ID}
            onChange={({currentTarget: {value}}: SyntheticEvent<HTMLInputElement>) => setNewProject({name: value})}
            value={newProject.name}
          />
        </label>
        <label>
          <button
            data-testid={PROJECT_NEW_BTN}
            disabled={newProject.name.length === 0}
            onClick={() => onCreate(newProject)}
          >Create</button>
        </label>
      </div>
      <ul data-testid={PROJECT_LIST_ID}>
        {projectsList}
      </ul>
    </div>
  )
}
