let fs = require("fs");
let puppeteer = require('puppeteer');

let cfile = process.argv[2];
let userToAdd = process.argv[3];

(async function(){
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null, 
        slowMo: 100, 
        args: ['--start-maximized', '--disable-notifications'] 
    });

    let contents = await fs.promises.readFile(cfile, 'utf-8');
    let obj = JSON.parse(contents);
    let user = obj.username;
    let pwd = obj.password;
    let url = obj.url;

    let pages = await browser.pages();
    let page = pages[0];
    page.goto(url, {
        waitUntil: 'networkidle0'
    });
    await page.waitForSelector('.auth-button', {
        visible: true
    });

    await page.type('#input-1', user);
    await page.type('#input-2', pwd);
    await page.click(".auth-button");
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.profile-menu .ui-icon-chevron-down.down-icon', {
        visible: true
    });


    await page.click('.profile-menu .ui-icon-chevron-down.down-icon');
    await page.click('[data-analytics=NavBarProfileDropDownAdministration]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForSelector('ul.nav-tabs', {
        visible: true
    });

    let manageLIs = await page.$$('ul.nav-tabs li')
    await manageLIs[1].click();
    let curl = page.url();
    
    let qidx = 0;
    let questionElement = await getQuestionElement(curl, qidx, page);
    while (questionElement !== undefined) {
        await handleQuestion(questionElement, page);
        qidx++;
        questionElement = await getQuestionElement(curl, qidx, page);
    }
})();


async function getQuestionElement(curl, qidx, page) {
    await page.goto(curl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('ul.nav-tabs', {
        visible: true
    });

    let pidx = parseInt(qidx / 10);
    qidx = qidx % 10;
    console.log(pidx + " " + qidx);

    let paginationBtns = await page.$$('.pagination li');
    let nextPageBtn = paginationBtns[paginationBtns.length - 2];
    let classOnNextPageBtn = await page.evaluate(function (el) {
        return el.getAttribute("class");
    }, nextPageBtn);

    for (let i = 0; i < pidx; i++) {
        if (classOnNextPageBtn !== 'disabled') {
            await nextPageBtn.click();
            await page.waitForSelector('.pagination li', {
                visible: true
            })

            paginationBtns = await page.$$('.pagination li');
            nextPageBtn = paginationBtns[paginationBtns.length - 2];
            classOnNextPageBtn = await nextPageBtn.evaluate(function (el) {
                return el.getAttribute("class");
            }, nextPageBtn)
        } else {
            return undefined;
        }
    }

    let questionElements = await page.$$('.backbone.block-center');
    if (qidx < questionElements.length) {
        return questionElements[qidx];
    } else {
        return undefined;
    }
}

async function handleQuestion(questionElement, page) {
    await questionElement.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForSelector('span.tag', {
        visible: true
    })

    await page.click('li[data-tab=moderators]');
    await page.waitForSelector('#moderator', {
        visible: true
    })

    await page.type('#moderator', userToAdd);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    
    await page.click('.save-challenge');
}