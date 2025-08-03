const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async (event) => {
  try {
    // Initial URL
    const initialUrl = "https://drive2.cscloud12.online/server1/qmsyfzbjcavekxfuwqbi/Movies/2022-01-30/CineSubz.com%20-%20Bro%20Daddy%20(2022)%20Malayalam%20TRUE%20WEB-DL-480P.mp4";

    // Fallback direct download URL
    const fallbackUrl = "https://07.cscloud12.online/cscloud?file=DmA29cSv%2BmlQvfLoyuDhx8M2szYQ1CsimrxAZAT3a5%2F7arxq0a2KtAuBkcynGyQC&expiry=GpolzaWzwypLpQMDjHwYsA%3D%3D&mac=eb5294dfd6cecff950c54487b4571521d2e616fae51ad20daa05ac500c06d5e3&acc=7";

    // Step 1: Fetch the initial page with memory-efficient settings
    let initialResponse = await axios.get(initialUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      maxRedirects: 0,
      maxContentLength: 1024 * 1024, // Limit to 1MB
    });

    let directDownloadUrl = null;

    // Step 2: Parse the page for the "Direct Download 2" button
    if (initialResponse.status === 200) {
      const $ = cheerio.load(initialResponse.data);
      const container = $("body").find("div, section").first(); // Narrow to likely container
      const directButton = container.find("button, a").filter((i, el) => 
        /Direct\s*Download\s*2/i.test($(el).text().trim()) || 
        /Download\s*2/i.test($(el).text().trim()) // Broaden match
      ).first();
      if (directButton.length) {
        directDownloadUrl = directButton.attr("href") || directButton.attr("onclick")?.match(/'([^']+)'/)?.[1];
        if (directDownloadUrl && !directDownloadUrl.startsWith("http")) {
          directDownloadUrl = new URL(directDownloadUrl, initialUrl).href;
        }
      }
    } else if (initialResponse.status === 403 || initialResponse.data.includes("Access Denied")) {
      directDownloadUrl = fallbackUrl; // Use fallback if access denied
    }

    // Step 3: Process the direct download URL
    let finalDownloadUrl = directDownloadUrl || "Not resolved";
    if (directDownloadUrl) {
      const downloadResponse = await axios.get(directDownloadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        maxRedirects: 3,
        maxContentLength: 1024 * 1024,
        validateStatus: (status) => status < 400 || [301, 302].includes(status),
      });

      if (downloadResponse.request.res.responseUrl) {
        finalDownloadUrl = downloadResponse.request.res.responseUrl;
      }
    }

    // Step 4: Return the result
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
    if (error.response && [302, 301].includes(error.response.status)) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "✅ Redirected Download URL",
          finalDownloadUrl: error.response.headers.location,
        }),
      };
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "❌ Server error: " + error.message }),
    };
  }
};
