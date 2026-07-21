const UPSTREAM_STATUS_URL = "https://r2.nsapi.top/latest/status.json";

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const upstreamUrl = new URL(UPSTREAM_STATUS_URL);
  upstreamUrl.search = requestUrl.search;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache"
      },
      cf: {
        cacheEverything: false,
        cacheTtl: 0
      }
    });
    const headers = new Headers({
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      "X-Content-Type-Options": "nosniff"
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers
    });
  } catch (_error) {
    return Response.json(
      { error: "status upstream unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store, max-age=0" }
      }
    );
  }
}
