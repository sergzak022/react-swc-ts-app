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

function runApp() {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

if (import.meta.env.MODE === 'development') {
  // NOTE: using `then` because top level await is not supported for torgets other than esnext
  import('./mocks/browser').then(({ start, populateData }) => {
    populateData()
    start()
    runApp()

  })
} else {
  runApp()
}


