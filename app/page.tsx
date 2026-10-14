"use client";

import { useEffect, useRef, useState } from "react";

type Item = { label: string; text: string; copied: boolean };
type Mode = "enc" | "dec";

const clamp = (v: number) => Math.min(25, Math.max(0, Math.round(v) || 0));

export default function Page() {
  const [mode, setMode] = useState<Mode>("enc");
  const [key, setKey] = useState("");
  const [shift, setShift] = useState(3);
  const [dkey, setDkey] = useState("");
  const [inp, setInp] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState("");
  const [wiping, setWiping] = useState(false);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  // ----- hapus semua + refresh -----
  const wipeAll = (message: string, delay: number) => {
    if (wiping) return;
    setWiping(true);
    setItems([]); setKey(""); setDkey(""); setInp(""); setShift(3);
    setMsg(message);
    setTimeout(() => window.location.reload(), delay);
  };
  const guard = () => {
    if (items.length) { wipeAll("Semua data dihapus.", 300); return true; }
    return false;
  };

  const switchMode = (m: Mode) => {
    if (guard()) return;
    setMode(m); setMsg("");
  };

  // ----- proses lewat API Python -----
  const run = async () => {
    if (guard()) return;
    if (mode === "enc" && !key) return setMsg("Isi kunci enkripsi dulu.");
    try {
      const res = await fetch("/api/cipher", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: inp, key, shift, dkey }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "Terjadi kesalahan.");
      setMsg("");
      setItems(data.items.map((x: { label: string; text: string }) => ({ ...x, copied: false })));
    } catch {
      setMsg("Tidak bisa menghubungi server.");
    }
  };

  // ----- salin -----
  const copyItem = async (i: number) => {
    if (wiping) return;
    const text = items[i].text;
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text; document.body.appendChild(t); t.select();
      ok = document.execCommand("copy");
      t.remove();
    }
    const next = items.map((x, j) => (j === i ? { ...x, copied: true } : x));
    setItems(next);
    if (!ok) return setMsg("Gagal menyalin.");
    if (next.every((x) => x.copied)) wipeAll("Semua sudah disalin. Semua data dihapus.", 900);
    else setMsg("Disalin. Tempel dulu di tempat tujuan, lalu salin yang satunya lagi.");
  };

  // ----- blokir salin langsung dari kotak hasil -----
  useEffect(() => {
    const inOut = (n: EventTarget | null) => {
      const node = n as Node | null;
      const el = node && node.nodeType === 3 ? node.parentElement : (node as Element | null);
      return !!el?.closest?.(".out");
    };
    const block = (e: Event) => { if (inOut(e.target)) e.preventDefault(); };
    const evs = ["cut", "contextmenu", "dragstart", "selectstart", "mousedown"];
    evs.forEach((ev) => document.addEventListener(ev, block));
    const onCopy = (e: ClipboardEvent) => {
      const sel = window.getSelection();
      if (itemsRef.current.length && sel &&
          [...document.querySelectorAll(".out")].some((o) => sel.containsNode(o, true)))
        e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (itemsRef.current.length && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" &&
          tag !== "INPUT" && tag !== "TEXTAREA") e.preventDefault();
    };
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    document.addEventListener("copy", onCopy);
    document.addEventListener("keydown", onKey);
    window.addEventListener("pageshow", onShow);
    return () => {
      evs.forEach((ev) => document.removeEventListener(ev, block));
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  return (
    <div className="app">
      <style>{CSS}</style>
      <main className="card">
        <h1>Caesar Cipher + Key</h1>
        <p className="sub">
          Kunci enkripsi dan kunci dekripsi berbeda. Setelah enkripsi, aplikasi membuat <b>Kunci Dekripsi</b> yang dikirim ke teman Anda.
        </p>

        <div className="tabs">
          <button className={mode === "enc" ? "" : "alt"} disabled={wiping} onClick={() => switchMode("enc")}>Enkripsi</button>
          <button className={mode === "dec" ? "" : "alt"} disabled={wiping} onClick={() => switchMode("dec")}>Dekripsi</button>
        </div>

        {mode === "enc" ? (
          <div className="item">
            <label>Kunci enkripsi (bebas: huruf, angka, simbol)
              <input type="text" value={key} onChange={(e) => setKey(e.target.value)}
                placeholder="contoh: rahasiaku123" autoComplete="off" spellCheck={false} />
            </label>
            <label>Shift: {shift}
              <input type="range" min={0} max={25} value={shift} onChange={(e) => setShift(clamp(+e.target.value))} />
              <input type="number" min={0} max={25} value={shift} onChange={(e) => setShift(clamp(+e.target.value))} autoComplete="off" />
            </label>
          </div>
        ) : (
          <label>Kunci dekripsi (dari pengirim, contoh: 1-QHAHPZH)
            <input type="text" value={dkey} onChange={(e) => setDkey(e.target.value)}
              placeholder="tempel kunci dekripsi di sini" autoComplete="off" spellCheck={false} />
          </label>
        )}

        <textarea rows={7} value={inp} onChange={(e) => setInp(e.target.value)}
          placeholder="Tempel teks atau kode di sini…" autoComplete="off" spellCheck={false} />

        <div className="row">
          <button disabled={wiping} onClick={run}>{mode === "enc" ? "Enkripsi" : "Dekripsi"}</button>
          <button className="alt" disabled={wiping} onClick={() => wipeAll("Semua data dihapus.", 300)}>Hapus semua</button>
        </div>

        <div className="item">
          {items.map((it, i) => (
            <div className="item" key={i}>
              <span>{it.label}</span>
              <div className="out">{it.text}</div>
              <button className="alt" disabled={it.copied || wiping} onClick={() => copyItem(i)}>
                {it.copied ? "Tersalin" : "Salin"}
              </button>
            </div>
          ))}
        </div>

        <p className="msg" role="status">{msg}</p>
        <p className="note">
          Setelah hasil muncul, menekan tombol apa pun selain Salin akan menghapus seluruh isi halaman. Hasil hanya bisa diambil lewat tombol Salin, dan halaman terhapus setelah semua hasil disalin. Teks dan kunci dikirim ke server untuk diproses (tidak disimpan). Caesar + key bukan enkripsi yang kuat; jangan dipakai untuk data yang benar-benar rahasia.
        </p>
      </main>
    </div>
  );
}

const CSS = `
:root{--bg:#e9ece6;--card:#fbfcf9;--ink:#1d2a22;--muted:#5d6b62;--line:#b9c4b5;--accent:#1f5c3f;--out:#eef1ec}
@media (prefers-color-scheme:dark){:root{--bg:#141a16;--card:#1c241f;--ink:#e4ebe5;--muted:#92a398;--line:#33423a;--accent:#4fa077;--out:#18201b}}
body{margin:0}
.app{box-sizing:border-box;min-height:100vh;background:var(--bg);color:var(--ink);font-family:Georgia,"Times New Roman",serif;display:flex;justify-content:center;padding:32px 16px}
.app *{box-sizing:border-box}
.card{width:100%;max-width:640px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:24px;display:flex;flex-direction:column;gap:14px;align-self:flex-start}
.card h1{margin:0;font-size:32px;letter-spacing:-.5px}
.card p{margin:0;line-height:1.5}
.sub{color:var(--muted)} .note{font-size:13px;color:var(--muted)} .msg{color:var(--accent);font-weight:600;min-height:1.2em}
.card label{display:flex;flex-direction:column;gap:6px;font-size:15px}
.card input[type=text],.card input[type=number],.card textarea{width:100%;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink);font-size:15px}
.card textarea{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;resize:vertical}
.card input[type=number]{width:90px;padding:6px}
.tabs{display:flex;gap:8px}.tabs button{flex:1}
.item{display:flex;flex-direction:column;gap:6px}
.row{display:flex;gap:8px;flex-wrap:wrap}
.out{min-height:56px;max-height:260px;overflow:auto;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--out);font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;white-space:pre-wrap;word-break:break-word;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:default}
.card button{padding:10px 16px;border:1px solid var(--accent);background:var(--accent);color:#fff;border-radius:6px;cursor:pointer;font-size:15px;font-family:inherit}
.card button.alt{background:transparent;color:var(--accent)}
.card button:disabled{opacity:.5;cursor:not-allowed}
.card :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;