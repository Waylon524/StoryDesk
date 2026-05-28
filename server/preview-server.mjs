import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const port = Number(process.env.STORYDECK_PREVIEW_PORT || 5175);
const maxBodyBytes = 30 * 1024 * 1024;
const libreOfficePath = resolveLibreOfficePath();

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    writeJson(response, 200, {
      ok: Boolean(libreOfficePath),
      libreOfficePath,
      message: libreOfficePath ? "LibreOffice preview renderer is ready." : "LibreOffice executable was not found."
    });
    return;
  }

  if (request.method === "POST" && request.url === "/render-pptx") {
    if (!libreOfficePath) {
      writeJson(response, 503, {
        error: "LibreOffice executable was not found. Set LIBREOFFICE_PATH or install LibreOffice."
      });
      return;
    }

    let workDir;
    try {
      const body = await readRequestBody(request);
      workDir = join(tmpdir(), `storydeck-preview-${randomUUID()}`);
      await mkdir(workDir, { recursive: true });
      const inputPath = join(workDir, "preview.pptx");
      await writeFile(inputPath, body);
      await runLibreOffice(libreOfficePath, inputPath, workDir);
      const pngPath = join(workDir, "preview.png");
      const png = await readFile(pngPath);
      response.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Length": String(png.byteLength)
      });
      response.end(png);
    } catch (error) {
      writeJson(response, 500, {
        error: error instanceof Error ? error.message : "Unknown render error"
      });
    } finally {
      if (workDir) {
        rm(workDir, { recursive: true, force: true }).catch(() => {});
      }
    }
    return;
  }

  writeJson(response, 404, { error: `No route for ${request.method} ${request.url}` });
});

server.listen(port, "127.0.0.1", () => {
  const status = libreOfficePath ? `using ${libreOfficePath}` : "LibreOffice not found";
  console.log(`StoryDeck preview server running at http://127.0.0.1:${port} (${status})`);
});

function resolveLibreOfficePath() {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/local/bin/soffice",
    "/usr/bin/soffice"
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.byteLength;
      if (size > maxBodyBytes) {
        reject(new Error("PPTX upload is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function runLibreOffice(executable, inputPath, outDir) {
  return new Promise((resolve, reject) => {
    execFile(
      executable,
      ["--headless", "--convert-to", "png", "--outdir", outDir, inputPath],
      { timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `LibreOffice failed to render ${basename(inputPath)}.${stderr ? ` ${stderr}` : ""}${stdout ? ` ${stdout}` : ""}`
            )
          );
          return;
        }
        resolve();
      }
    );
  });
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function writeJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}
