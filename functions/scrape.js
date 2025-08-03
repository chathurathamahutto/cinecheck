const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async (event) => {
  try {
    // Initial URL from your input
    const initialUrl = "https://drive2.cscloud12.online/server1/qmsyfzbjcavekxfuwqbi/Movies/2022-01-30/CineSubz.com%20-%20Bro%20Daddy%20(2022)%20Malayalam%20TRUE%20WEB-DL-480P.mp4";

    // Step 1: Fetch the initial page
    let initialResponse = await axios.get(initialUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      maxRedirects: 0, // Avoid following redirects initially
    });

    let directDownloadUrl = null;

    // Step 2: Parse the page for the "Direct Download 2" button
    if (initialResponse.status === 200) {
      const $ = cheerio.load(initialResponse.data);
      // Look for the "Direct Download 2" button with flexible matching
      const directButton = $("button, a").filter((i, el) => 
        $(el).text().trim().match(/Direct\s*Download\s*2/i)
      ).first();
      if (directButton.length) {
        directDownloadUrl = directButton.attr("href") || directButton.attr("onclick")?.match(/'([^']+)'/)?.[1];
        if (directDownloadUrl && !directDownloadUrl.startsWith("http")) {
          directDownloadUrl = new URL(directDownloadUrl, initialUrl).href; // Resolve relative URLs
        }
      }
    } else if (initialResponse.status === 403 || initialResponse.data.includes("Access Denied")) {
      // Fallback to the provided direct download URL if access is denied
      directDownloadUrl = "https://07.cscloud12.online/cscloud?file=DmA29cSv%2BmlQvfLoyuDhx8M2szYQ1CsimrxAZAT3a5%2F7arxq0a2KtAuBkcynGyQC&expiry=GpolzaWzwypLpQMDjHwYsA%3D%3D&mac=eb5294dfd6cecff950c54487b4571521d2e616fae51ad20daa05ac500c06d5e3&acc=7";
    }

    // Step 3: Process the direct download URL
    let finalDownloadUrl = directDownloadUrl;
    if (directDownloadUrl) {
      const downloadResponse = await axios.get(directDownloadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        maxRedirects: 5, // Follow redirects to get the final URL
        validateStatus: (status) => status < 400 || [301, 302].includes(status), // Accept redirects
      });

      if (downloadResponse.request.res.responseUrl) {
        finalDownloadUrl = downloadResponse.request.res.responseUrl; // Final URL after redirects
      } else if (downloadResponse.data && typeof downloadResponse.data === "string") {
        const $ = cheerio.load(downloadResponse.data);
        const downloadLink = $("a[href]").filter((i, el) => $(el).text().includes("Download")).attr("href");
        if (downloadLink) finalDownloadUrl = new URL(downloadLink, directDownloadUrl).href;
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
        finalDownloadUrl: finalDownloadUrl || "Not resolved",
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
