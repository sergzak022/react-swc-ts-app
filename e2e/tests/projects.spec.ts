import { test, expect } from '@playwright/test';
import { Users } from '../helpers/Users'
import { Projects } from '../helpers/Projects'

let usersHelper, projectsHelper
test.beforeEach(async ({page}) => {
  usersHelper = new Users(page)
  projectsHelper = new Projects(page)
})

//TODO
//1. Create project for new user
//2. Delete project for new user

test('should be able to create a new project', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');
  await usersHelper.createUser('foo@gmail.com', 'foo')
  await usersHelper.selectUser('foo@gmail.com')

  await projectsHelper.createProject('bar')

  const projectList = await page.getByTestId('Project-list')

  await expect(await projectList.getByText('bar')).toBeVisible();
});

test('should be able to delete a new project', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');
  await usersHelper.createUser('foo@gmail.com', 'foo')
  await usersHelper.selectUser('foo@gmail.com')

  await projectsHelper.createProject('bar')

  const projectList = await page.getByTestId('Project-list')

  projectList.filter({hasText: 'bar'})

  await projectList.getByTestId('Project-delete').click();


  await expect(await projectList.getByText('bar')).not.toBeVisible();
});
