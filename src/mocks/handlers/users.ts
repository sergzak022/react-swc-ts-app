import { rest } from 'msw'
import * as data from '../data'

export const handlers = [
  rest.get('api/users', (_req, res, ctx) => {
    return res(ctx.json(data.users.map(data.convertAPIUserToUser)))
  }),
  rest.post('api/users', async (req, res, ctx) => {
    const { email, name } = await req.json()
    const newUser = data.createUser({
      projectCount: 0,
      email, name
    })
    return res(ctx.json(data.convertAPIUserToUser(newUser)))
  }),
  rest.put('api/users/:userId', async (req, res, ctx) => {
    const user = await req.json()
    const updateUser = data.updateUser(data.convertAPIUserToUser(user))
    return res(ctx.json(data.convertAPIUserToUser(updateUser)))
  }),

  rest.delete('api/users/:userId', async (req, res, ctx) => {
    const { userId } = req.params
    const isDeleted = data.deleteUser(+userId)

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
          errorMessage: `Could not delete user with id $userId}`,
        }),
      )
    }
  }),
]


