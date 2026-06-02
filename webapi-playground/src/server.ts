import { createServer, type IncomingMessage } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(rootDir, "dist");
const port = Number.parseInt(process.env.PORT ?? "8080", 10);

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

const json = (statusCode: number, payload: unknown) =>
  Response.json(payload, { status: statusCode, headers: { "Cache-Control": "no-store" } });

const textResponse = (statusCode: number, body: string, contentType = "text/plain; charset=utf-8") =>
  new Response(body, {
    status: statusCode,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    }
  });

const readRequestBody = async (request: IncomingMessage) => {
  const contentType = request.headers["content-type"] ?? "";
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString("utf8");
  }
  if (typeof contentType === "string" && contentType.includes("application/json")) {
    return JSON.parse(body);
  }
  return body;
};

const serveFile = async (pathname: string) => {
  const filePath =
    pathname === "/" || pathname === "/index.html"
      ? join(rootDir, "index.html")
      : pathname === "/styles.css"
        ? join(rootDir, "styles.css")
        : pathname.startsWith("/dist/")
          ? join(distDir, pathname.slice("/dist/".length))
          : null;

  if (!filePath) {
    return null;
  }

  try {
    const data = await readFile(filePath);
    const type = mimeTypes[extname(filePath)] ?? "application/octet-stream";
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return null;
  }
};

createServer(async (request, response) => {
  if (!request.url || !request.method) {
    response.writeHead(400).end("Bad request");
    return;
  }

  const url = new URL(request.url, "http://localhost");
  console.log(`${request.method} ${url.pathname}${url.search}`);

  if (url.pathname === "/api/beacon" && request.method === "POST") {
    const body = await readRequestBody(request);
    console.log("beacon:", body);
    response.writeHead(204).end();
    return;
  }

  if (url.pathname === "/api/todo" && request.method === "GET") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }).end(
      JSON.stringify({
        userId: 1,
        id: 1,
        title: "Build a WebAPI playground",
        completed: false,
        updatedAt: new Date().toISOString()
      })
    );
    return;
  }

  if (url.pathname === "/api/download" && request.method === "GET") {
    const size = Number.parseInt(url.searchParams.get("size") ?? "4096", 10);
    const normalizedSize = Number.isFinite(size) && size > 0 ? Math.min(size, 1_000_000) : 4096;
    const chunk = "WebAPI Playground download payload.\n";
    const body = chunk.repeat(Math.ceil(normalizedSize / chunk.length)).slice(0, normalizedSize);
    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store"
    }).end(body);
    return;
  }

  if (url.pathname === "/api/echo" && request.method === "POST") {
    const body = await readRequestBody(request);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }).end(
      JSON.stringify({
        method: request.method,
        body,
        receivedAt: new Date().toISOString()
      })
    );
    return;
  }

  const asset = await serveFile(url.pathname);
  if (asset) {
    response.writeHead(asset.status, Object.fromEntries(asset.headers.entries()));
    response.end(Buffer.from(await asset.arrayBuffer()));
    return;
  }

  response.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  }).end("Not found");
}).listen(port, () => {
  console.log(`WebAPI Playground server listening on http://localhost:${port}`);
});
