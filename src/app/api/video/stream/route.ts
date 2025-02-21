// app/api/proxy-video/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response(
      JSON.stringify({ error: "Missing url query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Forward the Range header if provided
  const headers: Record<string, string> = {};
  const range = request.headers.get("range");
  if (range) {
    headers["Range"] = range;
  }

  try {
    // Fetch the video stream from Cloudinary
    const fetchResponse = await fetch(url, { headers });

    if (!fetchResponse.ok) {
      return new Response(JSON.stringify({ error: "Error fetching video" }), {
        status: fetchResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare headers for the client response
    const responseHeaders = new Headers();
    const contentType = fetchResponse.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }
    const contentLength = fetchResponse.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }
    responseHeaders.set("Accept-Ranges", "bytes");

    return new Response(fetchResponse.body, {
      status: fetchResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error proxying video:", error);
    return new Response(JSON.stringify({ error: "Error fetching video" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
