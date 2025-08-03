const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async (event) => {
  try {
    // Step 1: Start with the initial URL
    const initialUrl = "https://drive2.cscloud12.online/server1/qmsyfzbjcavekxfuwqbi/Movies/2022-01-30/CineSubz.com%20-%20Bro%20Daddy%20(2022)%20Malayalam%20TRUE%20WEB-DL-480P.mp4";

    // Fetch the initial page
    const initialResponse = await axios.get(initialUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      maxRedirects: 0, // Prevent following redirects to analyze the response
    });

    let directDownloadUrl = null;

    // Check if the initial page contains the direct download link
    if (initialResponse.status === 200) {
      const $ = cheerio.load(initialResponse.data);
      // Assume "Direct Download 2" button has a specific class or ID
      const directButton = $("button.direct-btn, a.direct-btn").filter((i, el) => 
        $(el).text().includes("Direct Download 2")
      ).first();
      if (directButton.length) {
        directDownloadUrl = directButton.attr("href") || directButton.attr("onclick")?.match(/'([^']+)'/)?.[1];
      }
    }

    // If no link found from button, use the provided direct download URL
    if (!directDownloadUrl) {
      directDownloadUrl = "https://07.cscloud12.online/cscloud?file=DmA29cSv%2BmlQvfLoyuDhx8M2szYQ1CsimrxAZAT3a5%2F7arxq0a2KtAuBkcynGyQC&expiry=GpolzaWzwypLpQMDjHwYsA%3D%3D&mac=eb5294dfd6cecff950c54487b4571521d2e616fae51ad20daa05ac500c06d5e3&acc=7";
    }

    // Step 2: Process the direct download URL
    const downloadResponse = await axios.get(directDownloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      maxRedirects: 5, // Allow redirects to follow to the final download
      validateStatus: (status) => status < 400, // Accept redirects
    });

    let finalDownloadUrl = directDownloadUrl;
    if (downloadResponse.request.res.responseUrl) {
      finalDownloadUrl = downloadResponse.request.res.responseUrl; // Get the final URL after redirects
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "✅ Final Download URL",
        initialUrl: initialUrl,
        directDownloadUrl: directDownloadUrl,
        finalDownloadUrl: finalDownloadUrl,
      }),
    };
  } catch (error) {
    if (error.response && error.response.status === 302) {
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
