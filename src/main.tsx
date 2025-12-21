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
import ThemePreview from './library/styles/ThemePreview'
import ProjectsFilterPage from './library/projects/ProjectsFilter'
import NewProjectFormPage from './library/projects/NewProjectForm'
import ProjectsListPage from './library/projects/ProjectsList'
import ProjectsPageLayoutPage from './library/projects/ProjectsPageLayout'
import { TestCasesPage } from './dev-tools-agent/test-cases'
import { initTheme } from './utils/themeToggle'
import { RootLayout } from './components/Layout'

// Initialize theme from localStorage on startup
initTheme()

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/jotai",
        element: <Jotai />,
      },
      {
        path: "/msv",
        element: <TryMSV />,
      },
      {
        path: "/library/styles/preview",
        element: <ThemePreview />,
      },
      {
        path: "/library/projects/filter",
        element: <ProjectsFilterPage />,
      },
      {
        path: "/library/projects/new-form",
        element: <NewProjectFormPage />,
      },
      {
        path: "/library/projects/list",
        element: <ProjectsListPage />,
      },
      {
        path: "/library/projects/layout",
        element: <ProjectsPageLayoutPage />,
      },
      {
        path: "/dev-tools-agent/test-cases",
        element: <TestCasesPage />,
      },
    ],
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
    
    // Initialize UI-Agent overlay
    import('./dev-tools-agent').then(({ initUiAgentOverlay }) => {
      initUiAgentOverlay()
    })
  })
} else {
  runApp()
}


