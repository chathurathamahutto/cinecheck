const puppeteer = require("puppeteer-core");

exports.handler = async (event) => {
  try {
    const initialUrl = "https://drive2.cscloud12.online/server1/qmsyfzbjcavekxfuwqbi/Movies/2022-01-30/CineSubz.com%20-%20Bro%20Daddy%20(2022)%20Malayalam%20TRUE%20WEB-DL-480P.mp4";

    // Launch headless browser
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Netlify
      headless: "new",
    });
    const page = await browser.newPage();

    // Navigate to the initial URL
    await page.goto(initialUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Check for Access Denied
    const accessDenied = await page.evaluate(() => document.body.innerText.includes("Access Denied"));
    let directDownloadUrl = null;

    if (!accessDenied) {
      // Find and click the "Direct Download 2" button
      const directButton = await page.$x("//button[contains(text(), 'Direct Download 2')]") || 
                          await page.$x("//a[contains(text(), 'Direct Download 2')]");
      if (directButton.length > 0) {
        await directButton[0].click();
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});
        directDownloadUrl = page.url(); // Get the URL after clicking
      }
    } else {
      // Fallback to the provided direct download URL
      directDownloadUrl = "https://07.cscloud12.online/cscloud?file=DmA29cSv%2BmlQvfLoyuDhx8M2szYQ1CsimrxAZAT3a5%2F7arxq0a2KtAuBkcynGyQC&expiry=WGJ5wXYd9wawhxxEilSQJw%3D%3D&mac=bfbba3dd335521d793f8e578a2c10a1904fe8b67927c85ed6b8b75dece8a1bc2&acc=4";
    }

    let finalDownloadUrl = directDownloadUrl || "Not resolved";

    // Process the direct download URL if obtained
    if (directDownloadUrl && !directDownloadUrl.includes("Not resolved")) {
      await page.goto(directDownloadUrl, { waitUntil: "networkidle2", timeout: 30000 });
      finalDownloadUrl = page.url(); // Final URL after any redirects
    }

    // Close browser
    await browser.close();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "✅ Final Download URL",
        initialUrl: initialUrl,
        directDownloadUrl: directDownloadUrl || "Not found",
        finalDownloadUrl: finalDownloadUrl,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "❌ Server error: " + error.message }),
    };
  }
};
