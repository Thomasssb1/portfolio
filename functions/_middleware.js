export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (!url.hostname.startsWith("www.")) {
    return next();
  }

  const config = await env.ASSETS.fetch(
    new Request(new URL("/site-config.json", url)),
  );
  const { canonicalHostname } = await config.json();

  if (url.hostname === `www.${canonicalHostname}`) {
    url.protocol = "https:";
    url.hostname = canonicalHostname;
    url.port = "";
    return Response.redirect(url.href, 301);
  }

  return next();
}
