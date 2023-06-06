import React from 'react';
import { Users } from "@components/Users";
import { Projects } from "@components/Projects";
import { useUserDashboard } from "@state";


function Jotai() {

  const {
    useUsers,
    useProjects
  } = useUserDashboard()

  const {
    users,
    fetchUsers,
    updateUser,
    createUser,
    deleteUser,
    selectedUser,
    setSelectedUser,
  } = useUsers

  const {
    projects,
    updateProject,
    createProject,
    deleteProject,
  } = useProjects

	React.useEffect(() => {
		fetchUsers();
  }, [fetchUsers]);

	const usersComponent = <Users
		users={users}
		onUserChange={updateUser}
		onUserCreate={createUser}
		onUserDelete={deleteUser}
    selectedUser={selectedUser}
    onUserSelectBtnClick={setSelectedUser}
  />

  const projectsComponent = <Projects
    projects={projects}
    onProjectChange={updateProject}
    onProjectCreate={createProject}
    onProjectDelete={deleteProject}
  />

  return (
    <>
      <div>
        {usersComponent}
      </div>
      <div>
        {projectsComponent}
      </div>
    </>
	)
}

export default Jotai;
