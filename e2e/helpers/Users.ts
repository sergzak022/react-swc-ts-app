import { Page } from '@playwright/test';


export class Users {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async fillInNewUserEmail(email: string) {
    await this.page.getByTestId('User-new-email-input').click();
    await this.page.getByTestId('User-new-email-input').fill(email);
  }

  async fillInNewUserName(name: string) {
    await this.page.getByTestId('User-new-name-input').click();
    await this.page.getByTestId('User-new-name-input').fill(name);
  }

  async createUser(email: string, name: string) {
    await this.fillInNewUserEmail(email)
    await this.page.getByTestId('User-new-email-input').press('Tab');
    await this.page.getByTestId('User-new-name-input').fill(name);
    await this.page.getByTestId('User-new-name-input').press('Tab');
    await this.page.getByTestId('User-new-btn').press('Enter');
  }


  async selectUser(email: string) {
    const userList = await this.page.getByTestId('Users-list')
    const newUserListItem = await userList.getByTestId('User').filter({hasText: email})
    await newUserListItem.getByTestId('User-select').click()
  }
}
