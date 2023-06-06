IN PROGRESS

this pages extends clean code principals listed here https://github.com/labs42io/clean-code-typescript#solid

it adds more clean code principals related to React

1. Each component should have at least one smoke test with default params
  - this will ensure that component doesn't crash for default params
  - this will make it easier for other engineers to add test in the future when fixing bugs

2. React building blocks:
  - Container (page) components - then connect to data sources not via passed parameters, lays out
  presentational components and manage shared state between these components, contains logic for business rules
  (business logic)

  - Presentational (dumb/leaf) components - they only use data passes via params and only contain presentational (related to UI) logic. They often
  serve as wrappers for design system components like Material UI, Bootstrap, etc.

  - Hooks - they let engineers to encapsulate access to data sources, business logic, shared state for presentational components. Hooks should
  be used by the container components, but can also be used by complex presentational components. Hooks often interface with base React hhoks and
  developer's defined hooks

  - Utilites (project.utils.ts) - is a module for a collection of pure (side-effect free) functions. Whenever you see some logic that can be defined as a pure
  function you should consider implementing it in the utils file. Use util functions over hooks if don't need to deal with state. Util functions
  often used inside hooks. Util functions are a lot easier to test than components and hooks since nothing needs to be mocked, so use util functions
  to improve code coverage

  - Models (types) - enable type checking for the code you write. Use strict type checking and avoid using any type. All the data that comes from
  data source should be type checked all the way as it moves to the presentational component. This will make it a lot easier to maintain and refactor
  your react applications

  - Constants (projects.constants.ts or costants.ts) - 
  - Styles
  - Tests
  - Routers and Routes
  
Data sources types:
  - URL storage (url and query params)
  - Memory storage (ex: Redux, React.useState, etc)
  - Local storage
  - Cookies storage
  - IndexDB
  - API


Clean React code concepts and suggestions:

1. Avoid writing business logic in the presentational component or interfacing with data sources
2. Before implementing a component define interface for the input parameters
