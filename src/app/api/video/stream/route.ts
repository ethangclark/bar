// app/api/proxy-video/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let videoUrl = searchParams.get("url");
  if (!videoUrl) {
    return new Response(
      JSON.stringify({ error: "Missing url query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  videoUrl = decodeURIComponent(videoUrl);

  // Pass the Range header along if provided
  const headers: Record<string, string> = {};
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  try {
    const responseFromCloudinary = await fetch(videoUrl, { headers });

    if (!responseFromCloudinary.ok) {
      return new Response(JSON.stringify({ error: "Error fetching video" }), {
        status: responseFromCloudinary.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward specific headers necessary for video streaming
    const responseHeaders = new Headers();
    const headersToForward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ];
    headersToForward.forEach((header) => {
      const value = responseFromCloudinary.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Fallback: if accept-ranges isn't provided, set it explicitly
    if (!responseHeaders.has("accept-ranges")) {
      responseHeaders.set("accept-ranges", "bytes");
    }

    return new Response(responseFromCloudinary.body, {
      status: responseFromCloudinary.status,
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
