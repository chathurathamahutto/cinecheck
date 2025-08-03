const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async (event) => {
  try {
    const url = "https://cinesubz.lk/api-rwjdzuehbdrwjdzuehbdzjyvxo2bhh0azjyvxo2bhh0auehbdruehbdrwjdzuehbdzjyvxo2bhh0azjyvxo2bhh0auehbdrwjdzuehbwjdzuehbdzjyvxo2bhh0azjyvxo2bhh0a/skmxuywenl/";

    // Fetch HTML
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Find the fake Google Drive link
    const linkTag = $("#link").attr("href");

    if (linkTag) {
      if (linkTag.includes("1:/")) {
        // Extract path after '1:/'
        const encodedPath = linkTag.split("1:/")[1];

        // Decode and re-encode path
        const decodedOnce = decodeURIComponent(encodedPath);
        const reencodedPath = encodeURIComponent(decodedOnce).replace(/%2F/g, "/");

        // Check if path ends with .mp4
        const finalUrl = reencodedPath.toLowerCase().endsWith(".mp4")
          ? `https://drive2.cscloud12.online/server1/${reencodedPath}`
          : `https://drive2.cscloud12.online/server1/${reencodedPath}?ext=mp4`;

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "✅ Final Working URL", url: finalUrl }),
        };
      } else {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "⚠️ Couldn't extract valid path." }),
        };
      }
    } else {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "❌ No <a id='link'> found." }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "❌ Server error: " + error.message }),
    };
  }
};
