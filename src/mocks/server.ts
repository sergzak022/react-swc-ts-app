// src/mocks/server.js
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import * as data from './data'

// This configures a request mocking server with the given request handlers.
const server = setupServer(...handlers)

export { data }

export function start() {
    server.listen()
}

export function stop() {
    server.close()
}

export function resetHandlers() {
    server.resetHandlers()
}

export function resetState() {
    data.resetUsers()
}

export function waitForResponse(maxWaitMS = 1000) {
  return new Promise<void>((res, rej) => {

    const timeoutId = setTimeout(() => {
      rej(`waitForResponse wait exceeded ${maxWaitMS} ms`)
    }, maxWaitMS)

    server.events.on('request:end', () => {
      clearTimeout(timeoutId)
      res()
      server.events.removeAllListeners()
    })

    server.events.on('request:unhandled', (req) => {
      clearTimeout(timeoutId)
      rej(new Error(`The ${req.method} ${req.url.href} request was unhandled.`))
      server.events.removeAllListeners()
    })
  })
}

