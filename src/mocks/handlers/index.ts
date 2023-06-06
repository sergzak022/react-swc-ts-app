import {handlers as projectsHandlers} from './projects'
import {handlers as usersHandlers} from './users'

export const handlers = [...projectsHandlers, ...usersHandlers]
