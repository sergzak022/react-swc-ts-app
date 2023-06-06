import { setupWorker } from 'msw'
import { handlers } from './handlers'
import * as data from './data'

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers)

export function start() {
  worker.start()
}

export function populateData() {
  data.seedUsers(10)
}
