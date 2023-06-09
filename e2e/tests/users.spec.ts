import { test, expect } from '@playwright/test';
import { Users } from '../helpers/Users'

let usersHelper
test.beforeEach(async ({page}) => {
  usersHelper = new Users(page)
})

test('create new button should be disabled if nothin is entered', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');
  await expect(await page.getByTestId('User-new-btn')).toBeDisabled()
});

test('create new button should be disabled if only email entered', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');

  await usersHelper.fillInNewUserEmail('foo@gmail.com')
  await expect(await page.getByTestId('User-new-btn')).toBeDisabled()
});

test('create new button should be disabled if only name entered', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');
  await usersHelper.fillInNewUserEmail('foo')
  await expect(await page.getByTestId('User-new-btn')).toBeDisabled()
});

test('create new button should be enabled if email and name are entered', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');

  await usersHelper.fillInNewUserEmail('foo@gmail.com')
  await usersHelper.fillInNewUserName('foo')

  await expect(await page.getByTestId('User-new-btn')).toBeEnabled()

});

test('create new user', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');

  await usersHelper.createUser('foo@gmail.com', 'foo')

  const userList = await page.getByTestId('Users-list')

  await expect(await userList.getByText('foo@gmail.com')).toBeVisible();
  await expect(await userList.getByText('foo', { exact: true })).toBeVisible();
});

test('delete new user', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');

  await usersHelper.createUser('foo@gmail.com', 'foo')

  const userList = await page.getByTestId('Users-list')

  const newUserListItem = await userList.getByTestId('User').filter({hasText: 'foo@gmail.com'})

  await newUserListItem.getByTestId('User-delete').click()

  await expect(await userList.getByText('foo@gmail.com')).not.toBeVisible();
  await expect(await userList.getByText('foo', { exact: true })).not.toBeVisible();
});

test('select new user', async ({ page }) => {
  await page.goto('http://localhost:5173/jotai');

  await usersHelper.createUser('foo@gmail.com', 'foo')
  await usersHelper.selectUser('foo@gmail.com')

  await expect(await page.getByText('*foo@gmail.com')).toBeVisible();
});


