import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Jalankan python/cipher.py: kirim JSON lewat stdin, ambil hasil dari stdout.
function runPython(input: string): Promise<string> {
  const py = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
  const script = path.join(process.cwd(), "python", "cipher.py");
  return new Promise((resolve, reject) => {
    const p = spawn(py, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`))));
    p.stdin.end(input);
  });
}

export async function POST(req: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const body = await req.text();
    if (body.length > 400_000) {
      return Response.json({ error: "Teks terlalu panjang." }, { status: 413, headers });
    }
    const data = JSON.parse(await runPython(body));
    return Response.json(data, { status: data.error ? 400 : 200, headers });
  } catch {
    return Response.json(
      { error: "Gagal menjalankan Python. Pastikan Python 3 terpasang (perintah python3 atau python)." },
      { status: 500, headers }
    );
  }
}