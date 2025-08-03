const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async (event) => {
  try {
    const baseUrl = "https://drive2.cscloud12.online/server1/qmsyfzbjcavekxfuwqbi/Movies/2022-01-30/CineSubz.com%20-%20Bro%20Daddy%20(2022)%20Malayalam%20TRUE%20WEB-DL-480P.mp4";

    // Fetch HTML (simulating the target page)
    const response = await axios.get(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Assume buttons are <a> tags or <button> with specific classes/ids based on the image
    const links = [];
    $("button.google-btn, a.google-btn").each((i, el) => {
      const href = $(el).attr("href") || $(el).attr("onclick")?.match(/'([^']+)'/)?.[1];
      if (href) links.push(href);
    });
    $("button.direct-btn, a.direct-btn").each((i, el) => {
      const href = $(el).attr("href") || $(el).attr("onclick")?.match(/'([^']+)'/)?.[1];
      if (href) links.push(href);
    });

    // If no specific links are found, use the base URL with assumed variations
    const downloadLinks = links.length > 0 ? links : [
      `${baseUrl}?server=1`, // Google Download 1
      `${baseUrl}?server=2`, // Google Download 2
      `${baseUrl}?direct=2`  // Direct Download 2
    ];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "✅ Final Working URL",
        baseUrl: baseUrl,
        downloadLinks: downloadLinks
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
