const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[BROWSER PAGEERROR]:`, err);
  });
  page.on('requestfailed', request => {
    console.error(`[BROWSER REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'sushhmagar@gmail.com');
    await page.type('input[type="password"]', 'sushreeka');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    await page.goto('http://localhost:5173/dashboard/books', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const content = await page.content();
    if (content.includes('Something went wrong') || content.includes('No books found')) {
      console.log('Books page issue: empty state or error boundary.');
    } else {
      console.log('Books page loaded.');
      const links = await page.$$('a[href^="/dashboard/books/"]');
      if (links.length > 0) {
        await links[0].click();
        await new Promise(r => setTimeout(r, 2000));
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log('--- BOOK DETAILS PAGE TEXT ---');
        console.log(bodyText.substring(0, 500));
        console.log('------------------------------');
      }
    }
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
