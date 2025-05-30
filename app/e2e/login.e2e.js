const { device, expect, element, by } = require('detox');

describe('Login Form', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should display the login form and take a screenshot', async () => {
    await expect(element(by.id('login-form'))).toBeVisible();
    // Capture screenshot of the login form
    await device.takeScreenshot('login_form');
  });
});
