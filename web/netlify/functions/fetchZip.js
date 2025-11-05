// netlify/functions/fetchZip.js
export default async (req, context) => {
  const url = new URL(req.url);
  const fileUrl = url.searchParams.get("url");

  if (!fileUrl) {
    return new Response(JSON.stringify({ error: "Missing ?url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch the file directly from Google Drive
    const driveResponse = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0", // prevents Google from returning HTML sometimes
      },
    });

    if (!driveResponse.ok) {
      throw new Error(`Drive returned ${driveResponse.status}`);
    }

    // Stream back the file to the client
    const buffer = await driveResponse.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (err) {
    console.error("Drive fetch failed:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch file from Drive",
        details: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
