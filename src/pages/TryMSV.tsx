import {useEffect} from 'react'
import { useProjects } from "@state/projects/useProjects";

function TryMSV() {
  const { fetchProjects } = useProjects()

  useEffect(() => {
    fetchProjects(0)
  }, [fetchProjects])

  return <div>TryMSV</div>
}


export default TryMSV;
