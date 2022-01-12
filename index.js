const webdriver = require("selenium-webdriver");
const { By } = webdriver;
const fs = require("fs");
const path = require("path");

let driver = new webdriver.Builder().forBrowser("chrome").build();

const stringGenerator = (length, withDigits = true) => {
  let result = "";
  let characters = "";

  withDigits
    ? (characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    : (characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const getTempEmail = async () => {
  await driver.get("https://smailpro.com/advanced");
  await driver.sleep(4000);
  return await driver.findElement(By.id("tempmail")).getAttribute("value");
};

const sendJetbrainsSignUpConfirmationEmail = async (email) => {
  await driver.switchTo().newWindow("tab");
  await driver.get("https://account.jetbrains.com/login");

  const jetbrainsSignUpInput = await driver.findElement(
    webdriver.By.id("email")
  );
  await jetbrainsSignUpInput.sendKeys(email);
  const btn = await driver.findElement(
    By.css(
      "body > div.footer-wrap > div.container > div.row > div > div > div > div > div > div.col-sm-4.col-sm-offset-1 > div:nth-child(2) > form > div.form-group.clearfix > button"
    )
  );
  await driver.executeScript("arguments[0].click();", btn);
};

const receiveConfirmationEmail = async () => {
  await driver.sleep(10000);

  const refreshBtn = await driver.findElement(
    By.css(
      "#app > main > div.grid.grid-cols-1.sm\\:grid-cols-7.text-sm.border-top > div.p-2.sm\\:col-span-4 > div > button"
    )
  );
  await driver.executeScript("arguments[0].click();", refreshBtn);
  await driver.sleep(6000);

  const receivedMail = await driver.findElement(
    By.xpath('//*[@id="app"]/main/div[1]/div[2]/div/div/div/div')
  );
  await driver.executeScript("arguments[0].click();", receivedMail);
  await driver.sleep(6000);

  const script = `
    const iframe = document.getElementById('message');
    const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
    const confirmation = innerDoc.querySelector('body > p:nth-child(2) > a').click();
  `;
  await driver.executeScript(script);
  await driver.sleep(6000);
};

const fillSignUpFormAndSubmit = async () => {
  const jetbrainsSignUpInputFirstName = await driver.findElement(
    By.id("firstName")
  );
  const firstName = stringGenerator(7, false);
  await jetbrainsSignUpInputFirstName.sendKeys(firstName);

  const jetbrainsSignUpInputLastName = await driver.findElement(
    By.id("lastName")
  );
  const lastName = stringGenerator(7, false);
  await jetbrainsSignUpInputLastName.sendKeys(lastName);

  const jetbrainsSignUpInputUserName = await driver.findElement(
    By.id("userName")
  );
  const userName = stringGenerator(15);
  await jetbrainsSignUpInputUserName.sendKeys(userName);

  const jetbrainsSignUpInputPassword = await driver.findElement(
    By.id("password")
  );
  const password = stringGenerator(20);
  await jetbrainsSignUpInputPassword.sendKeys(password);

  const jetbrainsSignUpInputPass2 = await driver.findElement(By.id("pass2"));
  await jetbrainsSignUpInputPass2.sendKeys(password);

  const checkBox = await driver.findElement(
    By.css(
      "body > div.footer-wrap > div.container > div.row > div > form > div:nth-child(1) > div.col-sm-7.col-md-6 > div > div:nth-child(8) > div.col-xs-8.control-field > div > label > input[type=checkbox]"
    )
  );
  await driver.executeScript("arguments[0].click();", checkBox);

  const submitBtn = await driver.findElement(
    By.css(
      "body > div.footer-wrap > div.container > div.row > div > form > div:nth-child(3) > div > div > div.col-xs-8.control-field > button"
    )
  );
  await driver.executeScript("arguments[0].click();", submitBtn);

  return { firstName, lastName, userName, password, date: new Date() };
};

const writeUserInfoInFile = async (userInfo) => {
  const filePath = path.resolve(__dirname, "./accounts.json");
  if (fs.existsSync(filePath)) {
    fs.truncateSync(filePath, 0);
    fs.appendFileSync(filePath, JSON.stringify(userInfo));
  } else {
    fs.writeFileSync(filePath, JSON.stringify(userInfo), {
      flag: "wx",
    });
  }
};

const renewLicense = async () => {
  let email = await getTempEmail();

  await sendJetbrainsSignUpConfirmationEmail(email);

  let tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[0]);

  await receiveConfirmationEmail();

  tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[2]);

  const user = await fillSignUpFormAndSubmit();

  await writeUserInfoInFile(user);
};

renewLicense();
