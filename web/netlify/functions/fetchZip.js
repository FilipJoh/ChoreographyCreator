export async function handler(event) {
  const fileUrl = event.queryStringParameters.url;
  if (!fileUrl) {
    return { statusCode: 400, body: "Missing 'url' parameter" };
  }

  try {
    // Initial fetch
    let res = await fetch(fileUrl, { redirect: "manual" });

    // Google sometimes returns a redirect or HTML with "confirm=" token
    if (res.status === 302 || res.headers.get("location")) {
      const redirectUrl = res.headers.get("location");
      res = await fetch(redirectUrl);
    } else if (res.headers.get("content-type")?.includes("text/html")) {
      const html = await res.text();
      const confirmMatch = html.match(/confirm=([0-9A-Za-z_]+)&/);
      if (confirmMatch) {
        const confirmUrl = `${fileUrl}&confirm=${confirmMatch[1]}`;
        res = await fetch(confirmUrl);
      } else {
        throw new Error("Drive confirmation required but not found");
      }
    }

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/zip",
        "Access-Control-Allow-Origin": "*",
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Error fetching Google Drive file:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
