export async function handler(event) {
  const fileUrl = event.queryStringParameters.url;
  if (!fileUrl) {
    return {
      statusCode: 400,
      body: "Missing 'url' parameter",
    };
  }

  console.log("Fetching file from:", fileUrl);

  try {
    async function fetchDriveFile(url, depth = 0) {
      if (depth > 5) throw new Error("Too many redirects or confirm loops");

      const res = await fetch(url, { redirect: "manual" });

      const location = res.headers.get("location");
      if (location) {
        console.log("Following redirect:", location);
        return fetchDriveFile(location, depth + 1);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        const html = await res.text();

        // 🔍 Try multiple patterns for confirm token
        const tokenPatterns = [
          /confirm=([0-9A-Za-z_-]+)&/g,
          /id=([0-9A-Za-z_-]+)&confirm=([0-9A-Za-z_-]+)/g,
          /confirm=([0-9A-Za-z_-]+)&amp;/g,
        ];

        let confirmToken = null;
        for (const pattern of tokenPatterns) {
          const match = pattern.exec(html);
          if (match) {
            confirmToken = match[1] || match[2];
            break;
          }
        }

        // 🧠 New fallback: look for the "href" link directly
        if (!confirmToken) {
          const altMatch = html.match(/href="(\/uc\?export=download[^"]+)"/);
          if (altMatch) {
            const confirmUrl = "https://drive.google.com" + altMatch[1].replace(/&amp;/g, "&");
            console.log("Following alt confirm link:", confirmUrl);
            return fetchDriveFile(confirmUrl, depth + 1);
          }
        }

        if (confirmToken) {
          const confirmUrl = `${fileUrl}&confirm=${confirmToken}`;
          console.log("Found confirm token:", confirmToken);
          return fetchDriveFile(confirmUrl, depth + 1);
        }

        console.warn("Unable to extract confirm token from Drive page.");
        throw new Error("Google Drive confirmation page not recognized");
      }

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }

      const buffer = await res.arrayBuffer();
      return buffer;
    }

    const buffer = await fetchDriveFile(fileUrl);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/zip",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Error fetching Google Drive file:", err);
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "Failed to fetch file from Drive",
        details: err.message,
      }),
    };
  }
}
