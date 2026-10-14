"""Caesar cipher + key. Dipanggil oleh Next.js: baca JSON dari stdin, tulis JSON ke stdout."""
import json
import re
import sys

MAX_TEXT = 100_000
DKEY_RE = re.compile(r"^(\d{1,2})-([A-Za-z]+)$")


def key_vals(key: str) -> list[int]:
    """Nilai tiap karakter kunci enkripsi = kode karakter mod 26."""
    return [ord(c) % 26 for c in key]


def add(text: str, shift: int, ks: list[int]) -> str:
    """Tiap huruf digeser (shift + nilai kunci). Kunci berulang & maju hanya di huruf."""
    k = 0

    def rep(m: re.Match) -> str:
        nonlocal k
        ch = m.group(0)
        base = 65 if ch <= "Z" else 97
        t = (shift + ks[k % len(ks)]) % 26
        k += 1
        return chr((ord(ch) - base + t) % 26 + base)

    return re.sub(r"[A-Za-z]", rep, text)


def encrypt(text: str, key: str, shift: int) -> list[dict]:
    vals = key_vals(key)
    ct = add(text, shift, vals)
    # Kunci dekripsi = kebalikan dari shift dan tiap nilai kunci
    token = f"{(26 - shift) % 26}-" + "".join(chr(65 + (26 - v) % 26) for v in vals)
    return [
        {"label": "Hasil enkripsi", "text": ct},
        {"label": "Kunci dekripsi (kirim ke teman)", "text": token},
    ]


def decrypt(text: str, dkey: str) -> list[dict]:
    m = DKEY_RE.match(dkey.strip())
    if not m or int(m.group(1)) > 25:
        raise ValueError("Format kunci dekripsi salah. Contoh: 1-QHAHPZH")
    ks = [ord(c) - 65 for c in m.group(2).upper()]
    return [{"label": "Hasil dekripsi", "text": add(text, int(m.group(1)), ks)}]


def handle(d: dict) -> dict:
    """Validasi permintaan lalu jalankan. Kembalikan {"items": [...]} atau {"error": "..."}."""
    try:
        text = str(d.get("text", ""))
        if len(text) > MAX_TEXT:
            raise ValueError("Teks terlalu panjang.")
        mode = d.get("mode")
        if mode == "enc":
            key = str(d.get("key", ""))
            if not key:
                raise ValueError("Isi kunci enkripsi dulu.")
            shift = max(0, min(25, int(d.get("shift", 0))))
            return {"items": encrypt(text, key, shift)}
        if mode == "dec":
            return {"items": decrypt(text, str(d.get("dkey", "")))}
        raise ValueError("Mode tidak dikenal.")
    except ValueError as e:
        return {"error": str(e)}
    except Exception:
        return {"error": "Permintaan tidak valid."}


if __name__ == "__main__":
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
        if not isinstance(data, dict):
            raise ValueError
        result = handle(data)
    except Exception:
        result = {"error": "Permintaan tidak valid."}
    sys.stdout.write(json.dumps(result))  # ASCII-only, aman di semua OS