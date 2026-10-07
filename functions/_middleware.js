export function onRequest({ request, next }) {
  const url = new URL(request.url);

  if (url.hostname === "www.thomasbeer.uk") {
    url.protocol = "https:";
    url.hostname = "thomasbeer.uk";
    url.port = "";
    return Response.redirect(url.href, 301);
  }

  return next();
}
