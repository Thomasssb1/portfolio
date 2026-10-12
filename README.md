# Thomas Beer portfolio

Run the site locally with:

```sh
npm run dev
```

Open <http://localhost:8788>. The Web Components load their HTML and CSS files over HTTP, so opening `frontend/index.html` directly will only show their fallback text.

Outbound links use `/go/` redirects to count clicks. All links to these redirects
carry `rel="nofollow"` to discourage crawler visits, and the redirects return
`X-Robots-Tag: noindex, nofollow`. Google Search Console can still list previously
crawled URLs as excluded by `noindex`. This is expected; the portfolio homepage is
the page intended for indexing. Keep `/go/` crawlable in `robots.txt` so crawlers
can read the `noindex` header.
