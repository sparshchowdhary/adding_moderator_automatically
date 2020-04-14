let fs = require('fs');
let puppeteer = require('puppeteer');
let cfile = process.argv[2];
let userToAdd = process.argv[3];
(async function () {
    try {
        const browser = await puppeteer.launch({
            headless: false, //it means browser will be visible
            defaultViewport: null,
            slowMo: 50,
            args: ['--start-maximized', '--disable-notifications'] //to avoid popups
        })
        let content = await fs.promises.readFile(cfile, 'utf-8');
        let object = JSON.parse(content);
        let username = object.username;
        let password = object.password;
        let url = object.url;
        let pages = await browser.pages();//gets array of pages or tabs
        let page = pages[0]; //first page
        page.goto(url, {    //opens url and wait till 0 requests are left remaining
            waitUntil: 'networkidle0'
        });
        await page.waitForSelector('.auth-button', { //wait till login button loads completely
            visible: true
        });
        await page.type('#input-1', username); //direct input in elements
        await page.type('#input-2', password);
        await page.click('.auth-button');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.waitForSelector('.profile-menu .ui-icon-chevron-down.down-icon', {
            visible: true
        }); //click on arrow near profile bar
        await page.click('.profile-menu .ui-icon-chevron-down.down-icon');
        await page.click('[data-analytics=NavBarProfileDropDownAdministration]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.waitForSelector('ul.nav-tabs', {
            visible: true
        });
        let manageTabs = await page.$$('ul.nav-tabs li');
        await manageTabs[1].click();
        page.waitForSelector('.pagination li',{
            visible:true
        });
        let currenturl = page.url();  //url of current page
        let questionIndex = 0;
        let question = await getQuestion(currenturl, questionIndex, page);
        while (question !== undefined) {
            await handleQuestion(question, page);
            questionIndex++;
            question = await getQuestion(currenturl, questionIndex, page);
        }
    } catch (err) {
        console.log(err);
    }
})();

async function getQuestion(currenturl, questionIndex, page) {
    await page.goto(currenturl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('ul.nav-tabs', {
        visible: true
    });
    let pageIndex = parseInt(questionIndex / 10);
    questionIndex = questionIndex % 10;
    console.log(pageIndex+" "+questionIndex);
    let pageBar = await page.$$('.pagination li');
    let nextPageButton = pageBar[pageBar.length - 2];
    let nextPageButtonClass = await nextPageButton.evaluate(function (element) {
        return element.getAttribute('class');
    }, nextPageButton);
    for (let i = 0; i < pageIndex; i++) {
        if (nextPageButtonClass !== 'disabled') {
            await nextPageButton.click();
            await page.waitForSelector('.pagination li', {
                visible: true
            })
            pageBar = await page.$$('.pagination li');
            nextPageButton = pageBar[pageBar.length - 2];
            nextPageButtonClass = await nextPageButton.evaluate(function (element) {
                return element.getAttribute('class');
            }, nextPageButton);
        } else {
            return undefined;
        }
    }
    let question = await page.$$('.backbone.block-center');
    if (questionIndex < question.length) {
        return question[questionIndex];
    } else {
        return undefined;
    }
}

async function handleQuestion(question, page) {
    await question.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForSelector('span.tag', {
        visible: true   //wait for span tag as it loads in last
    })
    await page.click('li[data-tab=moderators]');
    await page.waitForSelector('#moderator', {
        visible: true
    })
    await page.type('#moderator', userToAdd);
    await page.keyboard.press('Enter');
    await page.click('.save-challenge');
}