import { useMemo, useEffect } from 'react'
import { useUsers } from "@state/users/useUsers";
import { useProjects } from "@state/projects/useProjects";

export function useUserDashboard( ) {

  const useUsersRes = useUsers()
  const useProjectsRes = useProjects()

  const {selectedUser} =  useUsersRes
  const {fetchProjects} = useProjectsRes


  useEffect(() => {
    if (!selectedUser || !fetchProjects) {
      return
    }
		fetchProjects(selectedUser.id);
  }, [selectedUser, fetchProjects]);

  return useMemo(
    () => ({
      useUsers: useUsersRes,
      useProjects: useProjectsRes,
    }),
    [
      useUsersRes,
      useProjectsRes,
    ]
  )
}
