"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUID } from "@/lib/auth";

type AssetLite = { id: string; name?: string | null; type?: string | null };
type DocRow = {
  id: string;
  owner_id: string | null;
  asset_id: string | null;
  name: string | null;
  path: string | null;
  size: number | null;
  content_type: string | null;
  created_at: string | null;
};

type UploadItem = {
  tempId: string;
  file: File;
  progress: number; // 0-100
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

export default function DocumentManager() {
  const search = useSearchParams();
  const [uid, setUid] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetLite[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [assetId, setAssetId] = useState<string | "">("");
  const [assetFilter, setAssetFilter] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag & drop / progress state
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<Record<string, string | null>>({});
  const [encryptEnabled, setEncryptEnabled] = useState(false);
  const [passphrase, setPassphrase] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getCurrentUID();
      setUid(id || null);
      const fromQuery = search?.get("asset_id");
      if (fromQuery) {
        setAssetId(fromQuery);
        setAssetFilter(fromQuery);
      }
      await Promise.all([loadAssets(id || null), loadDocs(id || null)]);
      const ch = supabase
        .channel("docs-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => loadDocs(id || null))
        .subscribe();
      return () => {
        supabase.removeChannel(ch);
      };
    })();
  }, []);

  async function loadAssets(id: string | null) {
    const q = supabase.from("assets").select("id,name,type");
    const { data } = await (id ? q.eq("owner_id", id) : q);
    setAssets((data as any) ?? []);
  }

  async function loadDocs(id: string | null) {
    setLoading(true);
    const q = supabase
      .from("documents")
      .select("id,owner_id,asset_id,name,path,size,content_type,created_at")
      .order("created_at", { ascending: false });
    const { data, error } = await (id ? q.eq("owner_id", id) : q);
    if (error) console.error(error);
    setDocs((data as any) ?? []);
    setLoading(false);
  }

  function enqueue(files: FileList | File[]) {
    const arr = Array.from(files);
    const items: UploadItem[] = arr.map((f) => ({
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      progress: 0,
      status: "queued",
    }));
    setUploads((prev) => [...items, ...prev]);
    void startUploads(items);
  }

  async function startUploads(items: UploadItem[]) {
    if (!uid) return;
    setError(null);
    setUploading(true);
    try {
      for (const item of items) {
        // Start simulated progress (since SDK lacks progress callback)
        setUploads((prev) => prev.map((u) => (u.tempId === item.tempId ? { ...u, status: "uploading", progress: 10 } : u)));
        const sim = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.tempId === item.tempId && u.status === "uploading"
                ? { ...u, progress: Math.min(90, u.progress + 5) }
                : u
            )
          );
        }, 250);
        try {
          let key = `${uid}/${Date.now()}-${item.file.name}`;
          let uploadBlob: Blob = item.file;
          let recordedSize = item.file.size;
          let recordedType = item.file.type || null;

          if (encryptEnabled && passphrase.trim().length >= 6) {
            const enc = await encryptFile(item.file, passphrase.trim());
            key = key + ".enc";
            uploadBlob = enc.blob;
            recordedSize = enc.blob.size;
            // Keep original content type for later decrypt
            recordedType = item.file.type || null;
            // Upload encrypted blob
            const { error: upErr1 } = await supabase.storage.from("documents").upload(key, uploadBlob, {
              upsert: false,
              contentType: "application/octet-stream",
            });
            if (upErr1) throw upErr1;
            // Upload metadata JSON alongside
            const metaKey = key + ".meta.json";
            const metaBlob = new Blob([
              JSON.stringify(
                {
                  v: 1,
                  alg: "AES-GCM",
                  salt: enc.salt,
                  iv: enc.iv,
                  origName: item.file.name,
                  origType: item.file.type || null,
                  origSize: item.file.size,
                },
                null,
                2
              ),
            ], { type: "application/json" });
            const { error: upErr2 } = await supabase.storage.from("documents").upload(metaKey, metaBlob, {
              upsert: false,
              contentType: "application/json",
            });
            if (upErr2) throw upErr2;
          } else {
            // Plain upload
            const { error: upErr } = await supabase.storage.from("documents").upload(key, uploadBlob, {
              upsert: false,
              contentType: recordedType || undefined,
            });
            if (upErr) throw upErr;
          }

          const insert = {
            owner_id: uid,
            asset_id: assetId || null,
            name: item.file.name,
            path: key,
            size: recordedSize,
            content_type: recordedType,
          };
          const { error: insErr } = await supabase.from("documents").insert(insert as any);
          if (insErr) throw insErr;
          clearInterval(sim);
          setUploads((prev) => prev.map((u) => (u.tempId === item.tempId ? { ...u, progress: 100, status: "done" } : u)));
        } catch (e: any) {
          clearInterval(sim);
          setUploads((prev) => prev.map((u) => (u.tempId === item.tempId ? { ...u, status: "error", error: e?.message || "Upload failed" } : u)));
          setError(e?.message || "Upload failed");
        }
      }
      await loadDocs(uid);
    } finally {
      setUploading(false);
    }
  }

  // WebCrypto helpers for AES-GCM with PBKDF2
  async function encryptFile(file: File, pass: string): Promise<{ blob: Blob; salt: string; iv: string }> {
    const data = new Uint8Array(await file.arrayBuffer());
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const ivBytes = crypto.getRandomValues(new Uint8Array(12));
    // Ensure pure ArrayBuffer inputs for subtle crypto
    const saltBuf = new ArrayBuffer(saltBytes.byteLength);
    new Uint8Array(saltBuf).set(saltBytes);
    const ivBuf = new ArrayBuffer(ivBytes.byteLength);
    new Uint8Array(ivBuf).set(ivBytes);
    const key = await deriveKey(pass, saltBuf);
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBuf }, key, data);
    return {
      blob: new Blob([new Uint8Array(cipher)], { type: "application/octet-stream" }),
      salt: toB64(saltBytes),
      iv: toB64(ivBytes),
    };
  }

  async function decryptToBlob(meta: { salt: string; iv: string; origType: string | null }, pass: string, ciphertext: ArrayBuffer): Promise<Blob> {
    const saltBytes = fromB64(meta.salt);
    const ivBytes = fromB64(meta.iv);
    const saltBuf = new ArrayBuffer(saltBytes.byteLength);
    new Uint8Array(saltBuf).set(saltBytes);
    const ivBuf = new ArrayBuffer(ivBytes.byteLength);
    new Uint8Array(ivBuf).set(ivBytes);
    const key = await deriveKey(pass, saltBuf);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuf }, key, ciphertext);
    return new Blob([new Uint8Array(plain)], { type: meta.origType || "application/octet-stream" });
  }

  async function deriveKey(pass: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pass), { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  function toB64(bytes: Uint8Array): string {
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
  function fromB64(s: string): Uint8Array {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!uid) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    enqueue(files);
    (e.target as any).value = "";
  }

  async function link(docId: string, newAssetId: string | "") {
    const { error } = await supabase.from("documents").update({ asset_id: newAssetId || null }).eq("id", docId);
    if (error) console.error(error);
  }

  async function unlink(docId: string) {
    const { error } = await supabase.from("documents").update({ asset_id: null }).eq("id", docId);
    if (error) console.error(error);
  }

  async function remove(doc: DocRow) {
    if (doc.path) await supabase.storage.from("documents").remove([doc.path]);
    await supabase.from("documents").delete().eq("id", doc.id);
  }

  async function download(doc: DocRow) {
    if (!doc.path) return;
    // If encrypted (.enc), fetch meta + prompt for passphrase and decrypt client-side
    if (doc.path.endsWith(".enc")) {
      const pass = prompt("Enter passphrase to decrypt");
      if (!pass) return;
      const { data: d1 } = await supabase.storage.from("documents").createSignedUrl(doc.path, 120);
      const metaKey = `${doc.path}.meta.json`;
      const { data: d2 } = await supabase.storage.from("documents").createSignedUrl(metaKey, 120);
      const url1 = (d1 as any)?.signedUrl;
      const url2 = (d2 as any)?.signedUrl;
      if (!url1 || !url2) return alert("Unable to fetch signed URLs");
      const [cipherRes, metaRes] = await Promise.all([fetch(url1), fetch(url2)]);
      const cipher = await cipherRes.arrayBuffer();
      const meta = await metaRes.json();
      try {
        const blob = await decryptToBlob({ salt: meta.salt, iv: meta.iv, origType: meta.origType || doc.content_type || null }, pass, cipher);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = meta.origName || doc.name || "file";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        alert("Decryption failed. Check your passphrase.");
      }
      return;
    }
    // Plain download
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.path, 60);
    const url = (data as any)?.signedUrl;
    if (url) window.open(url, "_blank");
  }

  const assetMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of assets) m.set(a.id, a.name || a.type || a.id);
    return m;
  }, [assets]);

  // Build preview URLs for images/PDFs
  useEffect(() => {
    let cancelled = false;
    async function build() {
      const out: Record<string, string | null> = {};
      for (const d of docs.slice(0, 24)) {
        const ct = (d.content_type || "").toLowerCase();
        if (!d.path) continue;
        if (ct.startsWith("image/") || ct === "application/pdf") {
          const { data } = await supabase.storage.from("documents").createSignedUrl(d.path, 120);
          if (cancelled) return;
          out[d.id] = (data as any)?.signedUrl ?? null;
        }
      }
      if (!cancelled) setPreviews(out);
    }
    build();
    return () => {
      cancelled = true;
    };
  }, [docs]);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-slate-400">Link to asset (optional)</label>
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value as any)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <option value="">— None —</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.type || a.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-slate-400">Upload files</label>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={onUpload}
            disabled={uploading || !uid}
            className="mt-1 block w-64 cursor-pointer rounded-md border border-dashed border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-blue-600" checked={encryptEnabled} onChange={(e) => setEncryptEnabled(e.target.checked)} />
              Encrypt before upload
            </label>
            {encryptEnabled && (
              <input
                type="password"
                placeholder="Passphrase (min 6 chars)"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="rounded-md border px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
              />
            )}
          </div>
        </div>
      </div>

      {/* Drag & drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer?.files?.length) enqueue(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mb-3 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-slate-800"
            : "border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
        }`}
      >
        <p className="text-gray-600 dark:text-slate-300">Drag & drop files here, or click to browse</p>
      </div>

      {/* Upload queue with progress */}
      {uploads.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploads.map((u) => (
            <div key={u.tempId} className="flex items-center justify-between rounded-lg border p-2 text-xs dark:border-slate-800">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-slate-100">{u.file.name}</p>
                <p className="text-gray-500 dark:text-slate-400">{Math.ceil(u.file.size / 1024)} KB</p>
              </div>
              <div className="ml-3 w-40">
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800">
                  <div className={`h-2 rounded-full ${u.status === "error" ? "bg-red-500" : u.status === "done" ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${u.progress}%` }} />
                </div>
                <div className="mt-1 text-right text-[10px] text-gray-500 dark:text-slate-400">
                  {u.status === "uploading" && `${u.progress}%`}
                  {u.status === "done" && "Done"}
                  {u.status === "error" && (u.error || "Error")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mt-2">
        {assetFilter && (
          <div className="mb-2 text-xs text-gray-500 dark:text-slate-400">
            Filtering to selected asset. <button className="underline" onClick={() => setAssetFilter(null)}>Clear</button>
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-800">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
                <div className="h-6 w-24 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No documents yet. Upload files to get started.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border dark:divide-slate-800 dark:border-slate-800">
            {docs.filter((d) => !assetFilter || d.asset_id === assetFilter).map((d) => (
              <li key={d.id} className="flex items-center justify-between px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  {(() => {
                    const ct = (d.content_type || "").toLowerCase();
                    const url = previews[d.id] || null;
                    if (url && ct.startsWith("image/")) return <img src={url} alt={d.name || "image"} className="h-10 w-10 rounded object-cover" />;
                    if (url && ct === "application/pdf") return <span className="grid h-10 w-10 place-items-center rounded bg-red-50 text-red-600">PDF</span>;
                    return <span className="grid h-10 w-10 place-items-center rounded bg-gray-50 text-gray-500">FILE</span>;
                  })()}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{d.name || d.path}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                      {d.content_type || "file"} • {(d.size ?? 0) > 0 ? `${Math.ceil((d.size ?? 0) / 1024)} KB` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={d.asset_id ?? ""}
                    onChange={(e) => link(d.id, e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <option value="">Unlinked</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.type || a.id}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => download(d)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    Download
                  </button>
                  <button onClick={() => unlink(d.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    Unlink
                  </button>
                  <button onClick={() => remove(d)} className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
