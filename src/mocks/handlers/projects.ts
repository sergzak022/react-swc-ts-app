import { rest } from 'msw'
import * as data from '../data'

export const handlers = [
  rest.get('api/users/:userId/projects', (req, res, ctx) => {

    const { userId } = req.params

    const user = data.getUserById(+userId)

    if (user) {
      return res(ctx.json(user.projects))
    } else {
      return res(
        // Send a valid HTTP status code
        ctx.status(404),
        // And a response body, if necessary
        ctx.json({
          errorMessage: `User with id ${userId} not found`,
        }),
      )
    }
  }),

  rest.put('api/projects/:projectId', async (req, res, ctx) => {

    const project = await req.json()

    const updateProject = data.updateProject(project)

    if (updateProject) {
      return res(ctx.json(updateProject))
    } else {
      return res(
        // Send a valid HTTP status code
        ctx.status(404),
        // And a response body, if necessary
        ctx.json({
          errorMessage: `Project with id ${project?.id} not found`,
        }),
      )
    }

  }),

  rest.post('api/users/:userId/projects', async (req, res, ctx) => {

    const { userId } = req.params

    const newProject = await req.json()

    const dbProject = data.createProject(+userId, newProject)

    if (dbProject) {
      return res(ctx.json(dbProject))
    } else {
      return res(
        // Send a valid HTTP status code
        ctx.status(404),
        // And a response body, if necessary
        ctx.json({
          errorMessage: `User with id ${userId} not found`,
        }),
      )
    }
  }),

  rest.delete('api/projects/:projectId', async (req, res, ctx) => {

    const { projectId } = req.params

    const isDeleted = data.deleteProject(+projectId)

    if (isDeleted) {
      return res(
        ctx.status(200),
      )
    } else {
      return res(
        // Send a valid HTTP status code
        ctx.status(404),
        // And a response body, if necessary
        ctx.json({
          errorMessage: `Could not delete project with id ${projectId}`,
        }),
      )
    }

  }),
]

