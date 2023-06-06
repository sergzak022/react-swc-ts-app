// NOTE: keeping this just in case
// I don't use mirage anymore for mocking but instead use MSW
import {
  createServer, Model, Factory,
  RestSerializer
} from "miragejs"
import { faker } from '@faker-js/faker'
import { User } from './components/Users'

// NOTE: since miragejs types are not well updated I have to maintain
// MirageServer interface which will grow as we need to use more miragejs
// server functionality. This seems like a lot of work for the value.

export interface MirageServer {
  serializerOrRegistry: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serialize: (arg: any) => any
  },
  schema: {
    users: {
      all: () => Array<User>
    }
  },
  createList: (name: string, count: number) => void,
  shutdown: () => void,
}

export function startMirage( environment = 'development' ) {
  return createServer({
    environment,
    logging: true,
    serializers: {
      user: RestSerializer.extend({
        serialize(...args) {
          // This is how to call super, as Mirage borrows [Backbone's implementation of extend](http://backbonejs.org/#Model-extend)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json = (RestSerializer.prototype as any).serialize.apply(this, args)
          if ( json.user ) {
            json.user.id = +json.user.id
          }
          if ( json.users ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
            json.users.forEach( (user: any) => {
              user.id = +user.id
            })
          }
          return json;
        }
      })
    },
    models: {
      user: Model,
    },

    factories: {
      user: Factory.extend({
        id: idx => idx,
        email: () => faker.internet.email(),
        name: () => faker.name.fullName(),
      })
    },

    seeds(server) {
      server.createList('user', 10)
    },

    routes() {
      this.namespace = 'api'

      this.resource('user', { except: ["update"] })
      this.put('/users/:id', (schema, req) => {
        const id = req.params.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (schema as any).users.find(id).update(JSON.parse(req.requestBody))
      })

      this.post('/users', (schema, req) => {
        const attrs = JSON.parse(req.requestBody)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (schema as any).users.create(attrs)
      })

      this.passthrough()
    },
  }) as unknown as MirageServer
}

export function getUsers(server: MirageServer) : Array<User> | undefined {
  return server.serializerOrRegistry.serialize(server.schema.users.all())?.users
}
