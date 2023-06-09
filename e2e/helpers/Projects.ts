import { Page } from '@playwright/test';


export class Projects {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async createProject(name: string) {
    await this.page.getByTestId('Project-new-name-input').click();
    await this.page.getByTestId('Project-new-name-input').fill(name);
    await this.page.getByTestId('Project-new-btn').press('Enter');
  }

}
