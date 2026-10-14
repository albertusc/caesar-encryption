# Caesar Cipher + Key (Next.js + Python)

Aplikasi web untuk **mengenkripsi dan mendekripsi teks atau kode** dengan kunci bebas. Tampilannya dibuat dengan **Next.js**, dan logika enkripsinya ditulis dengan **Python**. Dijalankan lokal cukup dengan `npm run dev`.

Ciri khas aplikasi ini:

- **Kunci enkripsi dan kunci dekripsi berbeda.** Pengirim memakai kunci A, penerima memakai kunci B yang dibuat otomatis.
- **Hasil tidak bisa disalin langsung.** Teks hasil tidak bisa diblok, diklik kanan, atau di-Ctrl+C. Harus lewat tombol **Salin**.
- **Auto-hapus.** Setelah semua hasil disalin (atau tombol lain ditekan), seluruh isi halaman dihapus dan halaman di-refresh.

> **Peringatan jujur:** ini cipher klasik (varian Vigenère). Cocok untuk belajar dan iseng, **bukan** untuk data yang benar-benar rahasia. Lihat bagian [Keamanan](#13-keamanan-dan-batasan).

---

## Daftar isi

1. [Cara kerja singkat](#1-cara-kerja-singkat)
2. [Struktur folder](#2-struktur-folder)
3. [Prasyarat dan cara menjalankan](#3-prasyarat-dan-cara-menjalankan)
4. [Konsep algoritma (baca ini dulu)](#4-konsep-algoritma-baca-ini-dulu)
5. [File 1: `python/cipher.py`](#5-file-1-pythoncipherpy)
6. [File 2: `app/api/cipher/route.ts`](#6-file-2-appapicipherroutets)
7. [File 3: `app/page.tsx`](#7-file-3-apppagetsx)
8. [File bawaan Next.js (satu per satu)](#8-file-bawaan-nextjs-satu-per-satu)
9. [Kontrak API](#9-kontrak-api)
10. [Alur lengkap dari klik sampai hasil](#10-alur-lengkap-dari-klik-sampai-hasil)
11. [Panduan git push](#11-panduan-git-push)
12. [Pemecahan masalah](#12-pemecahan-masalah)
13. [Keamanan dan batasan](#13-keamanan-dan-batasan)
14. [Kamus istilah](#14-kamus-istilah)

---

## 1. Cara kerja singkat

```
 Browser (page.tsx)                Next.js server                    Python
 ┌──────────────────┐   POST     ┌────────────────────┐   stdin    ┌──────────────┐
 │ Form + tombol    │ ─────────► │ app/api/cipher/    │ ─────────► │ python/      │
 │ Enkripsi/Dekripsi│  /api/     │ route.ts           │  (JSON)    │ cipher.py    │
 │                  │  cipher    │ (jembatan)         │            │ (logika)     │
 │ Tampilkan hasil  │ ◄───────── │                    │ ◄───────── │              │
 └──────────────────┘   JSON     └────────────────────┘   stdout   └──────────────┘
                                                          (JSON)
```

Ada tiga lapisan:

| Lapisan | File | Tugas |
|---|---|---|
| Tampilan | `app/page.tsx` | Form, tombol, menampilkan hasil, fitur salin dan hapus. Berjalan di **browser**. |
| Jembatan | `app/api/cipher/route.ts` | Menerima permintaan dari browser, menjalankan Python, mengembalikan hasilnya. Berjalan di **server Next.js**. |
| Logika | `python/cipher.py` | Menghitung enkripsi dan dekripsi. Dijalankan sebagai proses Python. |

Kenapa tidak dihitung langsung di browser? Karena logikanya sengaja ditulis dengan Python. Jembatan `route.ts` yang menghubungkan dunia Next.js (JavaScript) dengan Python.

---

## 2. Struktur folder

File yang **Anda buat atau ganti sendiri** ditandai dengan tanda ✏️. File lain dibuat otomatis oleh `create-next-app` dan tidak perlu diubah.

```
caesar/
├── python/
│   └── cipher.py                  ✏️ BUAT   Logika cipher (Python)
├── app/
│   ├── api/
│   │   └── cipher/
│   │       └── route.ts           ✏️ BUAT   Jembatan Next.js ke Python
│   ├── page.tsx                   ✏️ GANTI  Halaman utama (tampilan)
│   ├── layout.tsx                 bawaan   Kerangka HTML semua halaman
│   ├── globals.css                bawaan   CSS global
│   └── favicon.ico                bawaan   Ikon tab browser
├── public/                        bawaan   File statis (gambar, svg)
├── types/                         otomatis Tipe TypeScript buatan Next.js (jangan diedit)
├── node_modules/                  otomatis Library hasil `npm install` (jangan diedit, jangan di-commit)
├── .gitignore                     bawaan   Daftar file yang tidak ikut git
├── AGENTS.md                      bawaan   Catatan untuk AI coding agent
├── eslint.config.mjs              bawaan   Aturan pengecekan kode
├── next-env.d.ts                  otomatis Deklarasi tipe Next.js
├── next.config.ts                 bawaan   Konfigurasi Next.js
├── package.json                   bawaan   Daftar library dan perintah npm
├── package-lock.json              otomatis Versi pasti tiap library
├── tsconfig.json                  bawaan   Konfigurasi TypeScript
└── README.md                      dokumen ini
```

> Folder `api/cipher.py` di root proyek (versi lama untuk Vercel) **tidak dipakai lagi**. Hapus dengan `rm -rf api`.
>
> Isi bawaan bisa sedikit berbeda tergantung versi Next.js yang terpasang (misalnya `AGENTS.md` dan folder `types/` ada di versi baru).

---

## 3. Prasyarat dan cara menjalankan

### Prasyarat

| Kebutuhan | Cek dengan | Keterangan |
|---|---|---|
| Node.js 18 atau lebih baru | `node --version` | Untuk menjalankan Next.js |
| Python 3.9 atau lebih baru | `python3 --version` (Windows: `python --version`) | Untuk logika cipher |

Python 3.9 diperlukan karena kode memakai penulisan tipe seperti `list[int]`.

### Menjalankan dari nol

```bash
# 1. Buat proyek Next.js
npx create-next-app@latest caesar --ts --app
cd caesar

# 2. Buat folder dan file sesuai bagian 2 (cipher.py, route.ts, page.tsx)
mkdir -p python app/api/cipher

# 3. Jalankan
npm run dev
```

Buka `http://localhost:3000`. Di GitHub Codespaces, klik **Open in Browser** pada notifikasi port 3000 (atau buka tab **Ports**).

### Uji cepat

Isi kunci `1234`, shift `3`, pesan `halo`, lalu tekan **Enkripsi**. Hasil yang benar:

- Hasil enkripsi: `hbnr`
- Kunci dekripsi: `23-DCBA`

### Menguji Python saja (tanpa web)

```bash
echo '{"mode":"enc","text":"halo","key":"1234","shift":3}' | python3 python/cipher.py
```

Keluaran yang benar:

```json
{"items": [{"label": "Hasil enkripsi", "text": "hbnr"}, {"label": "Kunci dekripsi (kirim ke teman)", "text": "23-DCBA"}]}
```

### Memilih perintah Python lain

```bash
PYTHON_BIN=python3.12 npm run dev
```

---

## 4. Konsep algoritma (baca ini dulu)

### 4.1 Nomor huruf

Huruf dihitung dari 0:

| a | b | c | d | e | f | g | h | i | j | k | l | m |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

| n | o | p | q | r | s | t | u | v | w | x | y | z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 |

Huruf besar dan kecil punya nomor yang sama (A=0, a=0). Ukuran huruf dipertahankan di hasil.

### 4.2 Mod 26 ("buang putaran penuh")

Alfabet hanya punya 26 huruf. Kalau hitungan melewati Z, kembali ke A, seperti jam yang kembali ke 1 setelah 12.

`x mod 26` = sisa pembagian `x` oleh 26.

| x | x mod 26 | Penjelasan |
|---|---|---|
| 9 | 9 | Belum lewat satu putaran |
| 26 | 0 | Tepat satu putaran, kembali ke awal |
| 35 | 9 | 35 − 26 |
| 52 | 0 | 2 putaran penuh |

### 4.3 Angka kunci

Tiap karakter kunci punya nomor kode komputer (tabel ASCII/Unicode). Nomor itu dikecilkan dengan mod 26.

Contoh kunci `1234`:

| Karakter | Kode komputer | mod 26 |
|---|---|---|
| `1` | 49 | 23 |
| `2` | 50 | 24 |
| `3` | 51 | 25 |
| `4` | 52 | 0 |

Jadi `1234` menjadi deretan **[23, 24, 25, 0]**. Deretan ini berulang kalau pesan lebih panjang dari kunci.

> Perhatikan: angka kunci **bukan** urutan alfabet. Huruf `r` bernilai 114 mod 26 = **10**, bukan 17.

### 4.4 Rumus enkripsi

```
huruf_baru = (nomor_huruf + shift + angka_kunci) mod 26
```

Aturan tambahan:

- Hanya huruf A–Z dan a–z yang diubah. Angka, spasi, dan simbol dibiarkan.
- Angka kunci hanya berpindah ke angka berikutnya **ketika ketemu huruf**. Spasi dan simbol tidak menghabiskan kunci.

### 4.5 Kunci dekripsi

Kunci dekripsi dibuat otomatis dari kebalikan kunci enkripsi:

```
shift_dekripsi = (26 − shift) mod 26
tiap angka kunci v  →  (26 − v) mod 26  →  ditulis sebagai huruf (0=A, 1=B, 2=C, ...)
bentuk akhir: "shift_dekripsi-HURUFKUNCI"
```

### 4.6 Rumus dekripsi

```
huruf_asli = (nomor_huruf + shift_dekripsi + angka_dari_huruf_kunci_dekripsi) mod 26
```

Dekripsi memakai mesin penggeser yang **sama** dengan enkripsi, hanya masukannya yang dibalik.

### 4.7 Kenapa dekripsi mengembalikan pesan asli?

Enkripsi menggeser huruf sejauh `shift + v`. Dekripsi menggeser sejauh `(26 − shift) + (26 − v)`. Totalnya:

```
(shift + v) + (26 − shift) + (26 − v) = 52 = 2 putaran penuh
```

Dua putaran penuh membuat huruf kembali ke posisi semula.

### 4.8 Contoh lengkap A: pesan `halo`, kunci `1234`, shift `3`

**Enkripsi** (angka kunci [23, 24, 25, 0]):

| Huruf | Nomor | Hitungan | mod 26 | Hasil |
|---|---|---|---|---|
| h | 7 | 7 + 3 + 23 = 33 | 7 | **h** |
| a | 0 | 0 + 3 + 24 = 27 | 1 | **b** |
| l | 11 | 11 + 3 + 25 = 39 | 13 | **n** |
| o | 14 | 14 + 3 + 0 = 17 | 17 | **r** |

Hasil enkripsi: **`hbnr`**

**Kunci dekripsi:**

- shift: 26 − 3 = **23**
- kunci: 23→3 (D), 24→2 (C), 25→1 (B), 0→0 (A) → **DCBA**
- hasil: **`23-DCBA`**

**Dekripsi** (angka dari DCBA = [3, 2, 1, 0], shift 23):

| Huruf | Nomor | Hitungan | mod 26 | Hasil |
|---|---|---|---|---|
| h | 7 | 7 + 23 + 3 = 33 | 7 | **h** |
| b | 1 | 1 + 23 + 2 = 26 | 0 | **a** |
| n | 13 | 13 + 23 + 1 = 37 | 11 | **l** |
| r | 17 | 17 + 23 + 0 = 40 | 14 | **o** |

Hasil: **`halo`**

### 4.9 Contoh lengkap B: pesan `AIUEO`, kunci `rahasia`, shift `25`

Angka kunci `rahasia`: r=114→**10**, a=97→**19**, h=104→**0**, a=97→**19**, s=115→**11**, i=105→**1**, a=97→**19**.

| Huruf | Nomor | Hitungan | mod 26 | Hasil |
|---|---|---|---|---|
| A | 0 | 0 + 25 + 10 = 35 | 9 | **J** |
| I | 8 | 8 + 25 + 19 = 52 | 0 | **A** |
| U | 20 | 20 + 25 + 0 = 45 | 19 | **T** |
| E | 4 | 4 + 25 + 19 = 48 | 22 | **W** |
| O | 14 | 14 + 25 + 11 = 50 | 24 | **Y** |

Hasil enkripsi: **`JATWY`**. Kunci dekripsi: **`1-QHAHPZH`**.

### 4.10 Nama jenis cipher ini

Ini **bukan Caesar biasa**. Yang paling dekat adalah **Vigenère cipher**. Caesar memakai satu angka geser untuk semua huruf, sedangkan di sini tiap huruf digeser dengan angka berbeda (polialfabetik). Aplikasi ini adalah varian Vigenère dengan dua perbedaan: ada shift tambahan, dan angka kunci diambil dari kode komputer karakter, bukan dari urutan alfabet.

---

## 5. File 1: `python/cipher.py`

**Lokasi:** `caesar/python/cipher.py` (folder `python` sejajar dengan `app`)
**Peran:** otak aplikasi. Semua perhitungan enkripsi dan dekripsi ada di sini.
**Cara dipanggil:** bukan sebagai server, tetapi sebagai skrip. Next.js menjalankannya, mengirim JSON lewat **stdin**, dan membaca jawaban JSON dari **stdout**.

### 5.1 Bagian import dan konstanta

```python
import json
import re
import sys

MAX_TEXT = 100_000
DKEY_RE = re.compile(r"^(\d{1,2})-([A-Za-z]+)$")
```

| Baris | Penjelasan |
|---|---|
| `import json` | Mengubah teks JSON menjadi data Python dan sebaliknya. |
| `import re` | Fitur regex (pencarian pola teks). Dipakai untuk menemukan huruf dan mengecek format kunci. |
| `import sys` | Akses ke stdin dan stdout (jalur masuk dan keluar data). |
| `MAX_TEXT = 100_000` | Batas panjang pesan: 100 ribu karakter. Tanda `_` hanya pemisah agar mudah dibaca. |
| `DKEY_RE = re.compile(...)` | Pola bentuk kunci dekripsi yang sah. |

Arti pola `^(\d{1,2})-([A-Za-z]+)$`:

| Bagian | Arti |
|---|---|
| `^` dan `$` | Seluruh teks harus cocok, dari awal sampai akhir. |
| `(\d{1,2})` | 1 atau 2 digit angka. Ini shift. Dalam kurung agar bisa diambil terpisah. |
| `-` | Tanda minus (pemisah). |
| `([A-Za-z]+)` | Satu huruf atau lebih. Ini kuncinya. |

Cocok: `23-DCBA`, `1-QHAHPZH`. Tidak cocok: `salah`, `23DCBA`, `23-`.

### 5.2 Function `key_vals`

```python
def key_vals(key: str) -> list[int]:
    return [ord(c) % 26 for c in key]
```

| Bagian | Penjelasan |
|---|---|
| `key: str` | Masukan: teks kunci. |
| `-> list[int]` | Keluaran: daftar angka. |
| `for c in key` | Ambil karakter kunci satu per satu. |
| `ord(c)` | Nomor kode komputer karakter itu. |
| `% 26` | Buang putaran penuh. |

Contoh: `key_vals("1234")` menghasilkan `[23, 24, 25, 0]`.

### 5.3 Function `add` (mesin penggeser)

```python
def add(text: str, shift: int, ks: list[int]) -> str:
    k = 0

    def rep(m: re.Match) -> str:
        nonlocal k
        ch = m.group(0)
        base = 65 if ch <= "Z" else 97
        t = (shift + ks[k % len(ks)]) % 26
        k += 1
        return chr((ord(ch) - base + t) % 26 + base)

    return re.sub(r"[A-Za-z]", rep, text)
```

| Baris | Penjelasan |
|---|---|
| `def add(text, shift, ks)` | Terima pesan, shift, dan daftar angka kunci. Dipakai untuk enkripsi **dan** dekripsi. |
| `k = 0` | Penghitung: sekarang memakai angka kunci yang ke berapa. |
| `def rep(m)` | Function kecil yang dipanggil **sekali untuk setiap huruf** yang ditemukan. `m` berisi huruf itu. |
| `nonlocal k` | Artinya "pakai `k` milik `add`". Tanpa ini perubahan `k` tidak tersimpan. |
| `ch = m.group(0)` | Ambil hurufnya (misal `"h"`). |
| `base = 65 if ch <= "Z" else 97` | Huruf besar mulai di kode 65 (A), huruf kecil di 97 (a). Basis menjaga ukuran huruf. |
| `t = (shift + ks[k % len(ks)]) % 26` | Total langkah geser. `k % len(ks)` membuat kunci berulang. |
| `k += 1` | Pindah ke angka kunci berikutnya. |
| `chr((ord(ch) - base + t) % 26 + base)` | `ord(ch) - base` = nomor huruf (0–25). Tambah `t`, mod 26, kembalikan ke kode komputer dengan `+ base`, ubah jadi huruf dengan `chr`. |
| `re.sub(r"[A-Za-z]", rep, text)` | Cari semua huruf di pesan, ganti tiap huruf dengan hasil `rep`. Yang bukan huruf tidak disentuh. |

### 5.4 Function `encrypt`

```python
def encrypt(text: str, key: str, shift: int) -> list[dict]:
    vals = key_vals(key)
    ct = add(text, shift, vals)
    token = f"{(26 - shift) % 26}-" + "".join(chr(65 + (26 - v) % 26) for v in vals)
    return [
        {"label": "Hasil enkripsi", "text": ct},
        {"label": "Kunci dekripsi (kirim ke teman)", "text": token},
    ]
```

| Baris | Penjelasan |
|---|---|
| `vals = key_vals(key)` | Ubah kunci jadi daftar angka. |
| `ct = add(...)` | Geser semua huruf. `ct` = ciphertext (hasil enkripsi). |
| `(26 - shift) % 26` | Shift dibalik. `% 26` agar shift 0 tetap 0, bukan 26. |
| `(26 - v) % 26` | Tiap angka kunci dibalik. |
| `chr(65 + ...)` | Ubah angka jadi huruf kapital (0→A, 1→B, dst). |
| `"".join(...)` | Gabungkan semua huruf jadi satu teks. |
| `return [...]` | Dua kotak yang ditampilkan di layar: hasil dan kunci dekripsi. |

### 5.5 Function `decrypt`

```python
def decrypt(text: str, dkey: str) -> list[dict]:
    m = DKEY_RE.match(dkey.strip())
    if not m or int(m.group(1)) > 25:
        raise ValueError("Format kunci dekripsi salah. Contoh: 1-QHAHPZH")
    ks = [ord(c) - 65 for c in m.group(2).upper()]
    return [{"label": "Hasil dekripsi", "text": add(text, int(m.group(1)), ks)}]
```

| Baris | Penjelasan |
|---|---|
| `dkey.strip()` | Buang spasi di awal dan akhir (kalau kunci tertempel dengan spasi). |
| `DKEY_RE.match(...)` | Cek bentuk kunci. Hasilnya `None` kalau tidak cocok. |
| `if not m or int(m.group(1)) > 25` | Tolak jika bentuk salah, atau shift lebih dari 25 (misal `99-ABC`). |
| `raise ValueError(...)` | Menghentikan function dan melaporkan error. Pesannya nanti tampil di layar. |
| `m.group(2).upper()` | Bagian huruf kunci, dijadikan huruf besar (jadi `dcba` pun diterima). |
| `ord(c) - 65` | Huruf jadi angka: A=0, B=1, dst. |
| `add(text, int(m.group(1)), ks)` | Pakai mesin yang sama dengan shift dan angka kunci dari kunci dekripsi. |

### 5.6 Function `handle` (pemeriksa permintaan)

```python
def handle(d: dict) -> dict:
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
```

| Baris | Penjelasan |
|---|---|
| `d: dict` | Data permintaan dari browser (sudah berbentuk dictionary). |
| `d.get("text", "")` | Ambil pesan. Kalau tidak ada, pakai teks kosong. |
| `len(text) > MAX_TEXT` | Tolak pesan yang terlalu panjang. |
| `mode == "enc"` | Mode enkripsi: ambil kunci, tolak kalau kosong. |
| `max(0, min(25, ...))` | Paksa shift ke rentang 0–25. `min(25, x)` batas atas, `max(0, x)` batas bawah. |
| `return {"items": ...}` | Jawaban sukses. |
| `mode == "dec"` | Mode dekripsi: ambil kunci dekripsi dari `dkey`. |
| `except ValueError as e` | Error yang kita sengaja munculkan, pesannya ditampilkan apa adanya. |
| `except Exception` | Error tak terduga lain (misal shift bukan angka). Pesan umum agar detail internal tidak bocor. |

### 5.7 Blok `__main__` (pintu masuk skrip)

```python
if __name__ == "__main__":
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
        if not isinstance(data, dict):
            raise ValueError
        result = handle(data)
    except Exception:
        result = {"error": "Permintaan tidak valid."}
    sys.stdout.write(json.dumps(result))
```

| Baris | Penjelasan |
|---|---|
| `if __name__ == "__main__":` | Blok ini hanya jalan kalau file dijalankan langsung (`python3 cipher.py`), bukan kalau di-import. |
| `sys.stdin.buffer.read()` | Baca semua data yang dikirim Next.js, dalam bentuk byte. |
| `.decode("utf-8")` | Ubah byte jadi teks UTF-8. Dipaksa agar huruf beraksen aman di semua sistem (termasuk Windows). |
| `or "{}"` | Kalau kosong, anggap objek kosong. |
| `json.loads(...)` | Ubah teks JSON jadi dictionary. |
| `isinstance(data, dict)` | Pastikan hasilnya objek, bukan angka atau daftar. |
| `handle(data)` | Proses permintaan. |
| `sys.stdout.write(json.dumps(result))` | Tulis jawaban ke stdout. `json.dumps` menghasilkan teks ASCII saja, jadi aman di semua OS. |

---

## 6. File 2: `app/api/cipher/route.ts`

**Lokasi:** `caesar/app/api/cipher/route.ts`
**Peran:** jembatan antara browser dan Python.
**Cara kerja Next.js:** file bernama `route.ts` di dalam folder `app/...` otomatis menjadi endpoint web. Karena foldernya `app/api/cipher/`, alamatnya adalah **`/api/cipher`**. Function `POST` di dalamnya menangani permintaan berjenis POST.

### 6.1 Import dan konfigurasi

```ts
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

| Baris | Penjelasan |
|---|---|
| `import { spawn } from "child_process"` | `spawn` menjalankan program lain (di sini: Python) sebagai proses terpisah. |
| `import path from "path"` | Alat menyusun alamat file yang benar di semua sistem operasi. |
| `runtime = "nodejs"` | Wajib. `child_process` hanya ada di Node.js, tidak di "Edge runtime". |
| `dynamic = "force-dynamic"` | Next.js tidak boleh menyimpan (cache) jawaban endpoint ini. Setiap permintaan dihitung ulang. |

### 6.2 Function `runPython`

```ts
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
```

| Baris | Penjelasan |
|---|---|
| `input: string` | Teks JSON yang akan dikirim ke Python. |
| `Promise<string>` | Function ini mengembalikan "janji" hasil berupa teks, karena menunggu Python selesai (tidak instan). |
| `process.env.PYTHON_BIN` | Kalau variabel lingkungan `PYTHON_BIN` diisi, pakai itu sebagai perintah Python. |
| `process.platform === "win32" ? "python" : "python3"` | Windows memakai `python`, Mac dan Linux memakai `python3`. |
| `process.cwd()` | Folder tempat `npm run dev` dijalankan, yaitu root proyek. |
| `path.join(..., "python", "cipher.py")` | Alamat lengkap ke `python/cipher.py`. |
| `new Promise((resolve, reject) => ...)` | `resolve` = "berhasil, ini hasilnya". `reject` = "gagal, ini errornya". |
| `spawn(py, [script], {...})` | Jalankan `python3 python/cipher.py`. |
| `stdio: ["pipe","pipe","pipe"]` | Hubungkan stdin, stdout, stderr ke Node supaya bisa dikirimi dan dibaca. |
| `let out`, `let err` | Wadah untuk menampung keluaran normal dan keluaran error. |
| `p.stdout.on("data", ...)` | Setiap ada potongan keluaran dari Python, tambahkan ke `out`. |
| `p.stderr.on("data", ...)` | Sama, untuk pesan error Python. |
| `p.on("error", reject)` | Terjadi kalau Python tidak bisa dijalankan sama sekali (misal tidak terpasang). |
| `p.on("close", ...)` | Dipanggil saat Python selesai. Kode `0` = sukses, `resolve(out)`. Selain itu `reject`. |
| `p.stdin.end(input)` | Kirim JSON ke Python lalu tutup jalur masuk. Tanpa menutup, Python menunggu selamanya. |

### 6.3 Function `POST`

```ts
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
```

| Baris | Penjelasan |
|---|---|
| `export async function POST(req)` | Nama `POST` wajib persis, supaya Next.js tahu ini penangan permintaan POST. |
| `headers = { "Cache-Control": "no-store" }` | Perintah ke browser dan perantara: jangan simpan jawaban ini (isinya sensitif). |
| `await req.text()` | Ambil isi permintaan sebagai teks. |
| `body.length > 400_000` | Tolak data raksasa sebelum sampai ke Python. Status **413** = terlalu besar. |
| `await runPython(body)` | Jalankan Python dan tunggu hasilnya. |
| `JSON.parse(...)` | Ubah teks JSON dari Python menjadi objek. |
| `status: data.error ? 400 : 200` | Kalau Python melaporkan error, kirim status **400**. Kalau sukses, **200**. |
| `catch { ... status: 500 }` | Kalau Python gagal dijalankan, kirim status **500** dengan pesan petunjuk. |

---

## 7. File 3: `app/page.tsx`

**Lokasi:** `caesar/app/page.tsx` (ganti seluruh isi file bawaan)
**Peran:** seluruh tampilan dan perilaku di browser.
**Catatan:** baris pertama `"use client"` wajib. Tanpa itu, fitur interaktif (tombol, state) tidak bisa dipakai di Next.js App Router.

### 7.1 Import, tipe, dan fungsi bantu

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Item = { label: string; text: string; copied: boolean };
type Mode = "enc" | "dec";

const clamp = (v: number) => Math.min(25, Math.max(0, Math.round(v) || 0));
```

| Baris | Penjelasan |
|---|---|
| `"use client"` | Kode ini berjalan di browser, bukan di server. |
| `useState` | Menyimpan data yang berubah dan memicu tampilan ulang. |
| `useEffect` | Menjalankan kode sekali saat halaman muncul (dan membersihkannya saat dibuang). |
| `useRef` | Kotak penyimpan yang nilainya selalu terbaru tapi tidak memicu tampilan ulang. |
| `type Item` | Bentuk satu hasil: `label` (judul kotak), `text` (isinya), `copied` (sudah disalin atau belum). |
| `type Mode` | Hanya boleh `"enc"` (enkripsi) atau `"dec"` (dekripsi). |
| `clamp(v)` | Paksa angka ke 0–25. `Math.round` membulatkan, `|| 0` mengganti angka tidak valid (misal kosong) jadi 0. |

### 7.2 State (ingatan komponen)

```tsx
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
```

| State | Isi | Nilai awal |
|---|---|---|
| `mode` | Tab aktif | `"enc"` |
| `key` | Kunci enkripsi yang diketik | kosong |
| `shift` | Angka shift | 3 |
| `dkey` | Kunci dekripsi yang ditempel | kosong |
| `inp` | Pesan masukan | kosong |
| `items` | Daftar hasil yang tampil | kosong (belum ada hasil) |
| `msg` | Pesan status di bawah | kosong |
| `wiping` | Sedang proses menghapus? | `false` |
| `itemsRef` | Salinan `items` terbaru untuk pendeteksi di `useEffect` | kosong |

Pola `[nilai, setNilai]`: `nilai` untuk membaca, `setNilai(...)` untuk mengubah.

`itemsRef` ada karena `useEffect` hanya berjalan sekali dan akan "terjebak" dengan nilai `items` lama. Dengan `useRef`, ia selalu bisa membaca isi terbaru.

### 7.3 Function `wipeAll` (hapus semua)

```tsx
const wipeAll = (message: string, delay: number) => {
  if (wiping) return;
  setWiping(true);
  setItems([]); setKey(""); setDkey(""); setInp(""); setShift(3);
  setMsg(message);
  setTimeout(() => window.location.reload(), delay);
};
```

| Baris | Penjelasan |
|---|---|
| `if (wiping) return` | Kalau sudah menghapus, jangan jalankan dua kali. |
| `setWiping(true)` | Tandai sedang menghapus. Semua tombol jadi nonaktif. |
| `setItems([]) ... setShift(3)` | Kosongkan hasil, kunci, pesan, dan kembalikan shift ke 3. |
| `setMsg(message)` | Tampilkan pesan, misalnya "Semua data dihapus." |
| `setTimeout(() => window.location.reload(), delay)` | Setelah `delay` milidetik, muat ulang seluruh halaman. Refresh menjamin tidak ada sisa data di memori halaman. |

### 7.4 Function `guard` (penjaga)

```tsx
const guard = () => {
  if (items.length) { wipeAll("Semua data dihapus.", 300); return true; }
  return false;
};
```

Dipanggil di awal tombol-tombol. Jika **sudah ada hasil di layar**, tombol itu tidak menjalankan tugasnya melainkan langsung menghapus semuanya, lalu mengembalikan `true` ("hentikan tombol ini"). Inilah aturan "menekan tombol lain setelah hasil muncul berarti hapus semua".

### 7.5 Function `switchMode`

```tsx
const switchMode = (m: Mode) => {
  if (guard()) return;
  setMode(m); setMsg("");
};
```

Berpindah tab. Pindah tab saat ada hasil juga memicu penghapusan (lewat `guard`).

### 7.6 Function `run` (tombol Enkripsi/Dekripsi)

```tsx
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
```

| Baris | Penjelasan |
|---|---|
| `async` | Function ini menunggu jawaban server. |
| `if (guard()) return` | Kalau ada hasil lama di layar, hapus semua dan berhenti. |
| `mode === "enc" && !key` | Mode enkripsi tapi kunci kosong: tampilkan pesan, jangan kirim ke server. |
| `fetch("/api/cipher", {...})` | Kirim permintaan POST ke `route.ts`. |
| `cache: "no-store"` | Jangan simpan jawaban di cache browser. |
| `JSON.stringify({...})` | Ubah data menjadi teks JSON. Semua field dikirim; Python memakai yang relevan sesuai `mode`. |
| `res.ok` | `true` jika status 200–299. |
| `data.error \|\| "Terjadi kesalahan."` | Tampilkan pesan error dari server (atau pesan umum). |
| `data.items.map(... copied: false)` | Simpan hasil, tiap item diberi tanda belum disalin. |
| `catch` | Terjadi kalau server mati atau tidak terjangkau. |

### 7.7 Function `copyItem` (tombol Salin)

```tsx
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
```

| Baris | Penjelasan |
|---|---|
| `i` | Nomor item yang disalin (0 = hasil, 1 = kunci dekripsi saat enkripsi). |
| `navigator.clipboard.writeText(text)` | Cara modern menyalin ke clipboard. |
| `catch { ... }` | Cara cadangan kalau yang modern ditolak browser: buat textarea tak terlihat, isi, pilih, `execCommand("copy")`, lalu hapus. |
| `items.map(... copied: true)` | Tandai item nomor `i` sudah disalin. |
| `next.every((x) => x.copied)` | Cek apakah **semua** item sudah disalin. |
| `wipeAll(..., 900)` | Kalau semua sudah disalin, hapus semuanya dan refresh. |
| `else setMsg(...)` | Kalau masih ada yang belum, minta pengguna menyalin yang satunya. |

Catatan: saat enkripsi ada dua item. Salin yang pertama, tempel di tempat tujuan, baru salin yang kedua (clipboard hanya menyimpan satu isi).

### 7.8 `useEffect` (pemblokir salin langsung)

Berjalan sekali saat halaman muncul. Memasang "penjaga" di seluruh dokumen.

```tsx
const inOut = (n: EventTarget | null) => { ... return !!el?.closest?.(".out"); };
const block = (e: Event) => { if (inOut(e.target)) e.preventDefault(); };
const evs = ["cut", "contextmenu", "dragstart", "selectstart", "mousedown"];
evs.forEach((ev) => document.addEventListener(ev, block));
```

| Bagian | Penjelasan |
|---|---|
| `inOut` | Mengecek apakah sesuatu berada di dalam kotak hasil (kelas `.out`). Kalau yang diklik adalah teks, naik ke elemen induknya dulu. |
| `e.preventDefault()` | Membatalkan aksi bawaan browser. |
| `cut` | Potong teks. |
| `contextmenu` | Klik kanan (menu Copy). |
| `dragstart` | Menyeret teks keluar. |
| `selectstart` | Mulai memblok teks. |
| `mousedown` | Klik mouse (mencegah blok dengan seret). |

```tsx
const onCopy = (e: ClipboardEvent) => {
  const sel = window.getSelection();
  if (itemsRef.current.length && sel &&
      [...document.querySelectorAll(".out")].some((o) => sel.containsNode(o, true)))
    e.preventDefault();
};
```

Mencegah Ctrl+C jika seleksi mencakup kotak hasil. `containsNode(o, true)` berarti "seleksi menyentuh sebagian atau seluruh kotak ini".

```tsx
const onKey = (e: KeyboardEvent) => {
  const tag = document.activeElement?.tagName;
  if (itemsRef.current.length && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" &&
      tag !== "INPUT" && tag !== "TEXTAREA") e.preventDefault();
};
```

Mencegah Ctrl+A (pilih semua) saat hasil tampil, kecuali kursor sedang di kolom input. `metaKey` adalah tombol Cmd di Mac.

```tsx
const onShow = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
```

Kalau halaman dibuka lewat tombol Back dari cache browser (`persisted`), refresh agar isi lama tidak muncul kembali.

```tsx
return () => { ...removeEventListener... };
```

Function pembersih: melepas semua penjaga saat komponen dibuang, agar tidak menumpuk.

### 7.9 Tampilan (JSX)

| Bagian | Penjelasan |
|---|---|
| `<style>{CSS}</style>` | Memasang CSS (variabel `CSS` di bagian bawah file). |
| Dua tombol `tabs` | Tab Enkripsi dan Dekripsi. Tab aktif tampil solid, yang lain `alt` (outline). `disabled={wiping}` menonaktifkannya saat menghapus. |
| `mode === "enc" ? (...) : (...)` | Mode enkripsi menampilkan kolom kunci dan shift. Mode dekripsi menampilkan kolom kunci dekripsi. |
| Kolom `type="text"` | `value` dan `onChange` menghubungkannya dengan state. `autoComplete="off"` dan `spellCheck={false}` mencegah browser menyimpan atau menggarisbawahi isinya. |
| `type="range"` + `type="number"` | Dua cara mengatur shift (slider dan angka), dua-duanya lewat `clamp`. |
| `<textarea>` | Kolom pesan masukan. |
| Tombol utama | Teksnya berubah: "Enkripsi" atau "Dekripsi" sesuai mode. |
| Tombol **Hapus semua** | Memanggil `wipeAll` langsung. |
| `items.map(...)` | Untuk tiap hasil, tampilkan judul, kotak `.out` (tidak bisa diseleksi), dan tombol Salin. Setelah disalin tombolnya jadi "Tersalin" dan nonaktif. |
| `<p className="msg" role="status">` | Pesan status. `role="status"` membuat pembaca layar membacakannya. |
| `<p className="note">` | Catatan penjelasan fitur dan peringatan keamanan. |

### 7.10 CSS

| Aturan | Fungsi |
|---|---|
| `:root{--bg...}` | Variabel warna untuk tema terang. |
| `@media (prefers-color-scheme:dark)` | Tema gelap otomatis mengikuti pengaturan perangkat. |
| `body{margin:0}` | Hilangkan jarak bawaan browser. |
| `.app` | Pembungkus penuh layar dengan latar dan font. |
| `.card` | Kartu putih di tengah, lebar maksimal 640px. |
| `.out` | Kotak hasil. `user-select:none` dan `-webkit-user-select:none` membuat teks tidak bisa diblok. `-webkit-touch-callout:none` mencegah menu tahan-lama di iOS. |
| `.card button` dan `.alt` | Tombol solid (utama) dan tombol outline (sekunder). |
| `:focus-visible` | Garis bantu saat navigasi dengan keyboard. |

---

## 8. File bawaan Next.js (satu per satu)

File-file ini dibuat otomatis oleh `create-next-app`. Anda **tidak perlu mengubahnya** untuk proyek ini.

| File / folder | Fungsi | Perlu diubah? |
|---|---|---|
| `app/layout.tsx` | Kerangka HTML yang membungkus semua halaman: tag `<html>`, `<body>`, judul tab (metadata), dan font. `page.tsx` tampil di dalam `layout.tsx`. | Tidak. Opsional: ubah `title` di `metadata` jadi "Caesar Cipher". |
| `app/globals.css` | CSS global (Tailwind dan warna dasar). CSS aplikasi ini sudah ada di `page.tsx`, jadi file ini dibiarkan. | Tidak |
| `app/favicon.ico` | Ikon kecil di tab browser. | Tidak |
| `public/` | Folder file statis (gambar, svg) yang dilayani langsung. Proyek ini tidak memakainya. | Tidak |
| `types/` | Tipe TypeScript buatan Next.js (misal `validator.ts`). Dibuat otomatis, bisa berubah sendiri. | Jangan diedit |
| `node_modules/` | Ribuan file library hasil `npm install`. Sangat besar. | Jangan diedit, jangan di-commit (sudah ada di `.gitignore`) |
| `.gitignore` | Daftar file yang tidak ikut git (`node_modules`, `.next`, dll). | Tidak |
| `AGENTS.md` | Catatan petunjuk untuk AI coding agent (hanya ada di versi Next.js baru). | Tidak |
| `eslint.config.mjs` | Aturan ESLint, alat yang memeriksa gaya dan kesalahan kode. | Tidak |
| `next-env.d.ts` | Deklarasi tipe Next.js. Dibuat otomatis. | Jangan diedit |
| `next.config.ts` | Pengaturan Next.js. Untuk proyek ini kosong (bawaan) dan cukup. | Tidak |
| `package.json` | Daftar library yang dipakai dan perintah npm: `npm run dev` (jalankan lokal), `npm run build` (buat versi produksi), `npm run start` (jalankan versi produksi), `npm run lint` (periksa kode). | Tidak |
| `package-lock.json` | Mengunci versi pasti tiap library agar instalasi di komputer lain sama persis. | Jangan diedit manual |
| `tsconfig.json` | Aturan TypeScript. | Tidak |
| `README.md` | Dokumen ini. | Sesukanya |

Pesan error merah soal `node_modules/has-symbols/tsconfig.json` di VS Code berasal dari file milik library, **bukan** kode Anda. Abaikan saja.

---

## 9. Kontrak API

Endpoint: **`POST /api/cipher`**
Header: `Content-Type: application/json`

### Permintaan enkripsi

```json
{ "mode": "enc", "text": "halo", "key": "1234", "shift": 3 }
```

| Field | Tipe | Keterangan |
|---|---|---|
| `mode` | string | `"enc"` |
| `text` | string | Pesan, maksimal 100.000 karakter |
| `key` | string | Kunci enkripsi, tidak boleh kosong |
| `shift` | angka | 0–25 (nilai di luar rentang dipotong) |

Jawaban (200):

```json
{
  "items": [
    { "label": "Hasil enkripsi", "text": "hbnr" },
    { "label": "Kunci dekripsi (kirim ke teman)", "text": "23-DCBA" }
  ]
}
```

### Permintaan dekripsi

```json
{ "mode": "dec", "text": "hbnr", "dkey": "23-DCBA" }
```

| Field | Tipe | Keterangan |
|---|---|---|
| `mode` | string | `"dec"` |
| `text` | string | Hasil enkripsi |
| `dkey` | string | Kunci dekripsi berbentuk `angka-HURUF` |

Jawaban (200):

```json
{ "items": [ { "label": "Hasil dekripsi", "text": "halo" } ] }
```

### Kode status

| Status | Arti | Contoh pesan |
|---|---|---|
| 200 | Sukses | berisi `items` |
| 400 | Permintaan salah | `Isi kunci enkripsi dulu.`, `Format kunci dekripsi salah. Contoh: 1-QHAHPZH`, `Mode tidak dikenal.` |
| 413 | Terlalu besar | `Teks terlalu panjang.` |
| 500 | Python gagal dijalankan | `Gagal menjalankan Python. Pastikan Python 3 terpasang ...` |

---

## 10. Alur lengkap dari klik sampai hasil

**Enkripsi `halo` dengan kunci `1234`, shift `3`:**

1. Pengguna mengisi form di `page.tsx` dan menekan **Enkripsi**.
2. `run()` dipanggil. `guard()` memeriksa tidak ada hasil lama. Kunci tidak kosong, lanjut.
3. `fetch` mengirim `{"mode":"enc","text":"halo","key":"1234","shift":3,"dkey":""}` ke `/api/cipher`.
4. `route.ts` (`POST`) menerima isi permintaan, memeriksa ukurannya.
5. `runPython` menjalankan `python3 python/cipher.py` dan mengirim JSON lewat stdin.
6. `cipher.py` membaca stdin, memanggil `handle`, lalu `encrypt`:
   - `key_vals("1234")` → `[23, 24, 25, 0]`
   - `add("halo", 3, [...])` → `hbnr`
   - kunci dekripsi → `23-DCBA`
7. Python menulis JSON ke stdout dan selesai (kode keluar 0).
8. `route.ts` membaca stdout, mengurai JSON, mengirimkannya ke browser dengan status 200.
9. `run()` menerima jawaban dan memanggil `setItems(...)`. Dua kotak hasil tampil.
10. Pengguna menekan **Salin** pada kotak pertama (disalin), menempelkannya di tempat tujuan, lalu **Salin** pada kotak kedua.
11. Setelah semua tersalin, `wipeAll` mengosongkan semua state dan me-refresh halaman. Tidak ada data tersisa.

---

## 11. Panduan git push

### Pertama kali (folder belum jadi repository)

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

| Perintah | Fungsi |
|---|---|
| `git init` | Membuat repository git di folder ini. |
| `git add .` | Menandai semua perubahan untuk disimpan. |
| `git commit -m "..."` | Menyimpan perubahan sebagai satu titik simpan. |
| `git branch -M main` | Menamai cabang utama `main`. |
| `git remote add origin URL` | Menghubungkan folder ini ke repo GitHub. |
| `git push -u origin main` | Mengirim ke GitHub. `-u` mengingat tujuannya untuk push berikutnya. |

### Update berikutnya (cukup 3 perintah)

```bash
git add .
git commit -m "tulis apa yang diubah"
git push
```

### Jika `git push` ditolak (403) di Codespaces

Codespaces hanya punya izin ke repo asalnya. Login ulang:

```bash
unset GITHUB_TOKEN
gh auth login          # pilih GitHub.com, HTTPS, Yes, Login with a web browser
gh auth setup-git
git push -u origin main
```

Jangan pernah menempelkan Personal Access Token ke file kode atau chat.

### Jika "Author identity unknown"

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

---

## 12. Pemecahan masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar masih bertuliskan "To get started, edit the page.tsx file" | `page.tsx` belum diganti | Ganti seluruh isinya dengan kode dari bagian 7 |
| Error "Gagal menjalankan Python..." | Python tidak terpasang atau nama perintah berbeda | Cek `python3 --version`. Jika perintahnya lain: `PYTHON_BIN=python3.12 npm run dev` |
| Error "Tidak bisa menghubungi server." | Server dev mati, atau `route.ts` tidak ada | Jalankan `npm run dev`, pastikan file ada di `app/api/cipher/route.ts` |
| 404 saat memanggil `/api/cipher` | Folder salah tempat | Pastikan path persis `app/api/cipher/route.ts` (bukan `api/` di root) |
| Python error `list[int]` / `TypeError` | Python lebih lama dari 3.9 | Perbarui Python ke 3.9+ |
| "Format kunci dekripsi salah" | Kunci dekripsi tidak berbentuk `angka-HURUF` | Salin persis kunci dari pengirim, contoh `23-DCBA` |
| Hasil dekripsi acak | Hasil enkripsi dan kunci dekripsi tidak berpasangan | Pastikan kunci dekripsi berasal dari enkripsi yang sama |
| Tombol Salin tidak menyalin | Browser memblokir clipboard (halaman tidak aman) | Pakai `localhost` atau HTTPS. Aplikasi sudah punya cara cadangan |
| Error merah di `node_modules/.../tsconfig.json` | Masalah file milik library di VS Code | Abaikan |
| Tema warna terlihat aneh | `globals.css` bawaan bentrok sedikit | Aman diabaikan, atau kosongkan isi `globals.css` |
| Port 3000 tidak terbuka di Codespaces | Port belum diteruskan | Buka tab **Ports**, klik ikon globe di baris port 3000 |

---

## 13. Keamanan dan batasan

Mohon dibaca jujur:

1. **Bukan enkripsi yang kuat.** Algoritma ini varian Vigenère, cipher dari abad ke-16. Bisa dipecahkan dengan analisis frekuensi (metode Kasiski), terutama untuk pesan panjang dengan kunci pendek.
2. **Kunci dekripsi diturunkan dengan rumus sederhana.** Siapa pun yang tahu rumusnya bisa menghitung kunci enkripsi dari kunci dekripsi (cukup dibalik). Ini bukan kunci publik–privat seperti RSA.
3. **Shift tidak menambah kekuatan.** Shift tetap bisa digabung ke dalam kunci, hasilnya sama.
4. **Hanya huruf yang dienkripsi.** Angka, simbol, dan spasi terlihat apa adanya. Struktur pesan (panjang kata, tanda baca) tetap terbaca.
5. **Data dikirim ke server.** Pesan dan kunci dikirim dari browser ke server Next.js lalu ke Python. Tidak ada kode penyimpanan atau log, tetapi datanya lewat jaringan. Jalankan lokal untuk menghindari ini.
6. **Pembatas salin bukan perlindungan penuh.** Screenshot dan developer tools (F12) tetap bisa mengambil isi kotak hasil. Fitur ini mencegah salin tidak sengaja, bukan pencurian disengaja.
7. **Hanya untuk lokal atau hosting dengan Python.** Jembatan `route.ts` menjalankan Python lewat `child_process`. Di hosting tanpa Python (misalnya Vercel biasa), tidak akan jalan.

Untuk keamanan sungguhan, gunakan enkripsi standar modern seperti **AES-256-GCM** dengan kunci dari password (PBKDF2 atau Argon2), atau alat seperti GPG.

---

## 14. Kamus istilah

| Istilah | Arti sederhana |
|---|---|
| **Cipher** | Aturan mengacak huruf agar tidak terbaca. |
| **Plaintext / ciphertext** | Pesan asli / pesan yang sudah diacak. |
| **Enkripsi / dekripsi** | Mengacak / mengembalikan ke pesan asli. |
| **Shift** | Jumlah langkah huruf digeser. |
| **Mod (modulo)** | Sisa pembagian. Dipakai agar hitungan kembali ke A setelah Z. |
| **ASCII / Unicode** | Daftar nomor kode untuk setiap karakter di komputer. |
| **JSON** | Format teks untuk menyimpan data terstruktur, contoh `{"a": 1}`. |
| **API / endpoint** | Alamat web yang menerima permintaan dan mengirim jawaban data. |
| **stdin / stdout** | Jalur masuk dan jalur keluar data sebuah program. |
| **Next.js** | Framework untuk membuat aplikasi web dengan React. |
| **Route handler** | File `route.ts` yang menjadi endpoint API di Next.js. |
| **State** | Data di halaman yang kalau berubah, tampilan ikut berubah. |
| **Client (browser) / server** | Client: berjalan di komputer pengguna. Server: berjalan di mesin yang melayani. |
| **Cache** | Penyimpanan sementara hasil lama supaya cepat. Di sini dimatikan karena data sensitif. |
| **Commit / push** | Menyimpan perubahan di git / mengirimnya ke GitHub. |
| **Codespaces** | Lingkungan koding berbasis browser dari GitHub. |