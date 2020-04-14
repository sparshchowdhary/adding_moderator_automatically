let fs=require('fs');
let swd=require('selenium-webdriver');
let cd=require('chromedriver');
let builder=new swd.Builder();
let driver=builder.forBrowser('chrome').build();
let cfile=process.argv[2];
let userToAdd=process.argv[3];
(async function(){      //use IIFE at top level code
  try{
      await driver.manage().setTimeouts({
          implicit:10000,
          pageLoad:20000
      });
      let content=await fs.promises.readFile(cfile,'utf-8');
      let object=JSON.parse(content);
      let username=object.username;
      let password=object.password;
      let url=object.url;
      await driver.get(url);
      let userElement=await driver.findElement(swd.By.css("#input-1"));
      let passwordElement=await driver.findElement(swd.By.css("#input-2"));
      await userElement.sendKeys(username);
      await passwordElement.sendKeys(password);
      let buttonLogin=await driver.findElement(swd.By.css(".auth-button"));
      await buttonLogin.click();
      let buttonAdmin=await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDownAdministration]"));
      let adminurl= await buttonAdmin.getAttribute('href');
      await driver.get(adminurl);
      let tabs=await driver.findElements(swd.By.css('ul.nav-tabs li'));
      let manageChallengeTab=await tabs[1].getAttribute('href');
      await driver.get(manageChallengeTab);
      //await tabs[1].click();
      let currenturl=await driver.getCurrentUrl();  //gets url of manage challenge tab
      let questionIndex=0;
      let questionElement=getQuestion(currenturl,questionIndex);
      while(questionElement!==undefined){
          await handleQuestion(questionElement);
          questionIndex++;
          questionElement=await getQuestion(currenturl,questionIndex);
      }
  }catch(err){
      console.log(err);
  }
})();

async function getQuestion(currenturl,questionIndex){
    await driver.get(currenturl);
    let pageIndex=parseInt(questionIndex/10);
    questionIndex=questionIndex%10;
    let pageButton=await driver.findElements(swd.By.css('.pagination li'));
    let nextPageButton=pageButton[pageButton.length-2];
    let nextPageButtonClass=await nextPageButton.getAttribute('class');
    for(let i=0;i<pageIndex;i++){
        if(nextPageButtonClass!=='disabled'){
            await nextPageButton.click();
             pageButton=await driver.findElements(swd.By.css('.pagination li'));
             nextPageButton=pageButton[pageButton.length-2];
             nextPageButtonClass=await nextPageButton.getAttribut('class');
        }else{
            return undefined;
        }
    }
    let questions=await driver.findElement(swd.By.css('.backbone.block-center'));
    if(questionIndex<questions.length){
        return questions[questionIndex];
    }else{
        return undefined;
    }
}

async function handleQuestion(questions){
    let questionurl=await questions.getAttribute('href');
    console.log(questionurl);
    await questions.click();
    // sleepSync(2000); // solution 1 -> if the page is ready before 2 seconds, we are waiting purposelessly, if the page is not ready after 2 seconds, this will fail
    
    // solution 2 - part1 (jugaad approach)
    // let nametext = await driver.findElement(swd.By.css('#name'));
    // await nametext.sendKeys('any text'); // changing to reliably open the discard popup
    // solution 2 -> part2
    // let cancelButton=await driver.findElement(swd.By.css('#cancelBtn'));
    // await cancelButton.click();

    // solution 3 - waiting for tags to load (we're using it)
    await driver.wait(swd.until.elementLocated(swd.By.css('span.tag')));
    let moderatorTab=await driver.findElement(swd.By.css('li[data-tab=moderator]'));
    await moderatorTab.click();
    let moderatorTextBox=await driver.findElement(swd.By.css('#moderator'));
    await moderatorTextBox.sendKeys(userToAdd);
    await moderatorTextBox.sendKeys(swd.Key.ENTER);
    let buttonSave=await driver.findElement(swd.By.css('.save-challenge'));
    await buttonSave.click();
}

async function waitForLoaderToLoad(){
    let loader=await driver.findElement(swd.By.css('#ajax-msg'));
    await driver.wait(swd.until.elementIsNotVisible(loader));
}

function sleepSync(duration){
    let current=Date.now();
    let limit=current+duration;
    while(current<limit){
        current=Date.now();
    }
}