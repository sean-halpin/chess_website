const { remote } = require('webdriverio');

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android',
  'appium:appPackage': 'com.android.settings',
  'appium:appActivity': '.Settings',
};

const wdOpts = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  logLevel: 'info',
  capabilities,
};

const retryAttempts = 5;
const retryDelay = 5000; // 5 seconds

async function runTest() {
  let driver;
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      driver = await remote(wdOpts);
      break; // Break the loop if successful
    } catch (error) {
      console.error(`Attempt ${attempt} failed. Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  if (!driver) {
    console.error(`Failed to initialize WebDriver after ${retryAttempts} attempts.`);
    return;
  }

  try {
    const batteryItem = await driver.$('//*[@text="Battery"]');
    await batteryItem.click();
  } finally {
    await driver.pause(1000);
    await driver.deleteSession();
  }
}

runTest().catch(console.error);
