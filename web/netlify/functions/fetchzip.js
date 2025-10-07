// netlify/functions/fetchZip.js
export async function handler(event, context) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      body: "Missing 'url' parameter",
    };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: `Failed to fetch: ${response.statusText}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream",
      },
      body: Buffer.from(arrayBuffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Error fetching file: " + err.message,
    };
  }
}
