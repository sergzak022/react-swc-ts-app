import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import App from './App'
import './index.css'
import Jotai from './pages/Jotai'
import TryMSV from './pages/TryMSV'

if (import.meta.env.MODE === 'development') {
  const { start, populateData } = await import('./mocks/browser')
  populateData()
  start()
}

const router = createBrowserRouter([
  {
    path: "/jotai",
    element: <Jotai />,
  },
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/msv",
    element: <TryMSV />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
