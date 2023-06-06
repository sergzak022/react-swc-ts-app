You can use stacblits to try some react features or libraries

https://stackblitz.com/edit/vitejs-vite-827zms?file=index.html&terminal=dev


Vim tab to 2 spaces
set noexpandtab
set tabstop=2
set shiftwidth=2

:set et sw=2 ts=2 sts=2

Setting up tests -> https://jestjs.io/docs/29.1/getting-started

Testing setupt issues:

1. `You appear to be using a native ECMAScript module configuration file, which is only supported when running Babel asynchronously.``
  - had to rename babel.config.js to babel.config.json
2. ReferenceError: React is not defined.
- Add this preset comfig to bable.config.json

```
    ["@babel/preset-react", {
      "runtime": "automatic"
    }]
```

Adding path aliasing
1. To let typesciprt know about path aliases update tsconfig.json file
    - add alias under compilerOptions.paths
    ```
{
  "compilerOptions": {
        "paths": {
          "@api/*": ["./api/*"],
          "@components/*": ["./components/*"]
        },
   }
}
    ```
2. To let vite know about path aliases and convert them for js code update vite.config.ts file
    - add alias under resolve
    ```
resolve: {
  alias: [
      { find: '@api', replacement: '/src/api' },
      { find: '@components', replacement: '/src/components' },
  ],
},
    ```
3. To let jest know about path aliases update jest.config.ts file
    -  update moduleNameMapper
    - order of keys matters. Put less specific last
    ```
moduleNameMapper: {
    '@api/(.*)': '<rootDir>/src/api/$1',
},
    ```
Enabling swc/jest

1. Had to add this to the jest.config.ts to make tests work
```
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
```
2. Had to make sure mappers exist for all path aliases that are used

```
  // from jest.config.ts
  moduleNameMapper: {
    '@api/(.*)': '<rootDir>/src/api/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
  },
```

TODO
1. [DONE] add unit tests for Users.tsx
2. Create Projects component that displays projects based on the user selected
  - Use TDD to develop
  - Creaet `useProjects` hook
  - Create container wrapper
  - Integrate into Jotai componnet
3. Update Users component to allow selection of a user
  - Use TDD to develop
4. Integrate Users and Projects components 
  - Use TDD to develop
5. [DONE] Add unit tests for `useUsers` hook
6. Integrate jotai state
  - observe behaviors
7. Integrate Rematch state
  - observe behaviors
8. Integrate Zustand state
  - observe behaviors
9. Integrate MobX state
  - observe behaviors
10. Integrate e2e framework (https://webdriver.io/)
