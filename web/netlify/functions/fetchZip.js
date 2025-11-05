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
    // Helper function to fetch and follow Google confirm pages
    async function fetchDriveFile(url, depth = 0) {
      if (depth > 3) throw new Error("Too many redirects");

      const res = await fetch(url, { redirect: "manual" });

      // If Google returns a redirect header, follow it
      const location = res.headers.get("location");
      if (location) {
        console.log("Following redirect:", location);
        return fetchDriveFile(location, depth + 1);
      }

      // If content is HTML, check if it's a confirm page
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const html = await res.text();

        // Match confirm token (Google virus scan page)
        const confirmMatch = html.match(/confirm=([0-9A-Za-z_]+)&/);
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const confirmUrl = `${fileUrl}&confirm=${confirmToken}`;
          console.log("Found confirm token:", confirmToken);
          return fetchDriveFile(confirmUrl, depth + 1);
        }

        console.warn("Received HTML instead of file:", html.slice(0, 200));
        throw new Error("Google Drive returned an HTML confirmation page");
      }

      // If we get here, we have a valid binary response
      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }

      const buffer = await res.arrayBuffer();
      return buffer;
    }

    // --- Fetch actual file data ---
    const buffer = await fetchDriveFile(fileUrl);

    // --- Return the zip to client ---
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
