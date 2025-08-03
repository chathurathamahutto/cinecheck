const puppeteer = require("puppeteer-core");

exports.handler = async (event) => {
  try {
    const initialUrl = "https://drive2.cscloud12.online/server1/qmsyfzbjcavekxfuwqbi/Movies/2022-01-30/CineSubz.com%20-%20Bro%20Daddy%20(2022)%20Malayalam%20TRUE%20WEB-DL-480P.mp4";

    // Fallback direct download URL
    const fallbackUrl = "https://07.cscloud12.online/cscloud?file=DmA29cSv%2BmlQvfLoyuDhx8M2szYQ1CsimrxAZAT3a5%2F7arxq0a2KtAuBkcynGyQC&expiry=WGJ5wXYd9wawhxxEilSQJw%3D%3D&mac=bfbba3dd335521d793f8e578a2c10a1904fe8b67927c85ed6b8b75dece8a1bc2&acc=4";

    // Launch headless browser with channel
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Netlify
      headless: "new",
      channel: "chrome", // Try to use the stable Chrome channel
      executablePath: process.env.CHROME_PATH || undefined, // Fallback to env variable if set
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
        directDownloadUrl = page.url();
      }
    } else {
      directDownloadUrl = fallbackUrl; // Use fallback if access denied
    }

    let finalDownloadUrl = directDownloadUrl || "Not resolved";

    // Process the direct download URL if obtained
    if (directDownloadUrl && !directDownloadUrl.includes("Not resolved")) {
      await page.goto(directDownloadUrl, { waitUntil: "networkidle2", timeout: 30000 });
      finalDownloadUrl = page.url();
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
    await browser?.close().catch(() => {}); // Ensure browser closes on error
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "❌ Server error: " + error.message }),
    };
  }
};
