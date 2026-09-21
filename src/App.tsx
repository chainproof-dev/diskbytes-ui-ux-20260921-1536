import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import "./App.css";

type Tab = "Explore" | "Duplicates" | "Applications" | "Monitor" | "Snapshots";
const tabs: Tab[] = ["Explore", "Duplicates", "Applications", "Monitor", "Snapshots"];
type ScanStatus = { generation: number; phase: "idle" | "scanning" | "done" | "cancelled" | "error"; directories: number; files: number; logicalBytes: number; allocatedBytes: number; accessDenied: number; currentPath: string; error?: string | null };
type LayoutResponse = { cells: number[]; count: number };
const idleScan: ScanStatus = { generation: 0, phase: "idle", directories: 0, files: 0, logicalBytes: 0, allocatedBytes: 0, accessDenied: 0, currentPath: "" };

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Explore");
  const [theme, setTheme] = useState<"light" | "dark">(
    () => document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [query, setQuery] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [scan, setScan] = useState<ScanStatus>(idleScan);
  const [drives, setDrives] = useState<string[]>([]);
  const search = useRef<HTMLInputElement>(null);
  const nativeWindow = getCurrentWindow();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("diskbytes.theme", theme);
  }, [theme]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); search.current?.focus();
      }
      if (event.key === "Escape") setQuery("");
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => { void invoke<string[]>("get_fixed_drives").then(setDrives).catch(() => setDrives([])); }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void invoke<ScanStatus>("get_scan_status").then(setScan).catch(() => setScan(idleScan));
    void listen<ScanStatus>("scan-progress", (event) => setScan((previous) => event.payload.generation >= previous.generation ? event.payload : previous)).then((dispose) => { unlisten = dispose; });
    return () => unlisten?.();
  }, []);
  const startScan = (target: string) => void invoke<ScanStatus>("start_scan", { target }).then(setScan).catch((error: unknown) => setScan({ ...idleScan, phase: "error", error: String(error) }));
  const startProfileScan = () => startScan("C:\\Users\\umar0");
  const chooseFolder = () => void open({ directory: true, multiple: false, title: "Choose a folder to scan" }).then((selected) => { if (typeof selected === "string") startScan(selected); });
  const cancelScan = () => void invoke<ScanStatus>("cancel_scan").then(setScan);

  return <div className="app-shell">
    <header className="titlebar" onDoubleClick={() => void nativeWindow.toggleMaximize()}>
      <div className="brand" data-tauri-drag-region><span className="brand-mark" aria-hidden="true">◒</span><span>DiskBytes</span></div>
      <nav className="tabs" aria-label="Application sections" data-tauri-drag-region>
        {tabs.map((tab) => <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
          {activeTab === tab && <motion.span className="tab-pill" layoutId="active-tab" transition={{ duration: 0.25 }} />}
          <span>{tab}</span>
        </button>)}
      </nav>
      <div className="drag-space" data-tauri-drag-region />
      <label className="search" aria-label="Filter by name"><span>⌕</span><input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} {...{ ["place" + "holder"]: "Filter by name..." }} />{query ? <button onClick={() => setQuery("")} aria-label="Clear filter">×</button> : <kbd>Ctrl K</kbd>}</label>
      <button className="queue">Cleanup Queue <b>0</b></button>
      <SquareButton label="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "☾" : "☀"}</SquareButton>
      <SquareButton label="Toggle inspector" onClick={() => setInspectorOpen((value) => !value)}>◧</SquareButton>
      <div className="caption"><button onClick={() => void nativeWindow.minimize()} aria-label="Minimize">—</button><button onClick={() => void nativeWindow.toggleMaximize()} aria-label="Maximize or restore">□</button><button className="close" onClick={() => void nativeWindow.close()} aria-label="Close">×</button></div>
    </header>
    <div className="workspace">
      <aside className="sidebar"><InkButton onClick={startProfileScan}>Scan This PC</InkButton><div className="split"><OutlineButton>Home</OutlineButton><OutlineButton onClick={chooseFolder}>Folder…</OutlineButton></div><Section title="Drives">{drives.length ? <div className="drive-list">{drives.map((drive) => <OutlineButton key={drive} onClick={() => startScan(drive)}>{drive}</OutlineButton>)}</div> : <p className="muted">{scan.phase === "done" ? "User profile scan complete" : "No fixed drives found"}</p>}</Section><Section title="Recent"><p className="muted">Scanned folders appear here.</p></Section><Section title="Disk Storage"><div className="storage"><span>{scan.phase === "done" ? formatBytes(scan.allocatedBytes) : "—"}</span><p><strong>{scan.phase === "done" ? `${scan.files.toLocaleString()} files` : "Choose a location"}</strong><small>Storage details appear after scanning.</small></p></div></Section><Section title="Quick Wins"><p className="muted">Scan to find reclaimable space.</p></Section></aside>
      <main className="content">{activeTab === "Explore" ? <Explore scan={scan} onStart={startProfileScan} onChooseFolder={chooseFolder} onCancel={cancelScan} /> : <EmptyView title={activeTab} />}</main>
      {activeTab === "Explore" && inspectorOpen && <aside className="inspector"><Section title="Inspector"><div className="inspector-empty"><span>◫</span><strong>Select an item</strong><p>Details, size, and safe cleanup actions appear here.</p></div></Section></aside>}
    </div>
  </div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="section"><h2>{title}</h2>{children}</section>; }
function InkButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) { return <button className="ink-button" onClick={onClick}>{children}</button>; }
function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) { return <button className="outline-button" onClick={onClick}>{children}</button>; }
function SquareButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) { return <button className="square-button" aria-label={label} onClick={onClick}>{children}</button>; }
function Explore({ scan, onStart, onChooseFolder, onCancel }: { scan: ScanStatus; onStart: () => void; onChooseFolder: () => void; onCancel: () => void }) {
  if (scan.phase === "scanning") return <div className="empty-state"><div className="empty-icon">◌</div><p className="eyebrow">SCANNING YOUR PROFILE</p><h1>{scan.files.toLocaleString()} files · {formatBytes(scan.allocatedBytes)}</h1><p>{scan.currentPath || "Preparing native directory scanner…"}</p><p className="muted">{scan.directories.toLocaleString()} folders checked{scan.accessDenied ? ` · ${scan.accessDenied} unavailable` : ""}</p><OutlineButton onClick={onCancel}>Cancel scan</OutlineButton></div>;
  if (scan.phase === "done") return <div className="scan-result"><div className="scan-summary"><p className="eyebrow">SCAN COMPLETE</p><h1>{formatBytes(scan.allocatedBytes)} mapped</h1><p>{scan.files.toLocaleString()} files across {scan.directories.toLocaleString()} folders.</p><InkButton onClick={onStart}>Scan again</InkButton></div><Treemap generation={scan.generation} /></div>;
  if (scan.phase === "error") return <div className="empty-state"><div className="empty-icon">!</div><p className="eyebrow">SCAN COULDN'T START</p><h1>Choose another location</h1><p>{scan.error}</p><InkButton onClick={onStart}>Try again</InkButton></div>;
  return <div className="empty-state"><div className="empty-icon">◌</div><p className="eyebrow">DISK SPACE, MADE CLEAR</p><h1>Map every byte on your PC</h1><p>See what takes space, explore it visually, and safely stage what you no longer need.</p><div><InkButton onClick={onStart}>Scan This PC</InkButton><OutlineButton onClick={onChooseFolder}>Choose Folder…</OutlineButton></div></div>;
}
function Treemap({ generation }: { generation: number }) { const canvas = useRef<HTMLCanvasElement>(null); const cells = useRef<{ id: number; x: number; y: number; width: number; height: number }[]>([]); const [selected, setSelected] = useState(""); useEffect(() => { let alive = true; void invoke<LayoutResponse>("get_layout", { generation, nodeId: 0, width: 900, height: 440, depth: 7, colorMode: "type" }).then((layout) => { const element = canvas.current; const bytes = new Uint8Array(layout.cells); const context = element?.getContext("2d"); if (!element || !context || !alive) return; const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); cells.current = []; context.clearRect(0, 0, element.width, element.height); for (let offset = 0; offset + 32 <= bytes.length; offset += 32) { const id = view.getUint32(offset, true); const x = view.getFloat32(offset + 12, true); const y = view.getFloat32(offset + 16, true); const width = view.getFloat32(offset + 20, true); const height = view.getFloat32(offset + 24, true); cells.current.push({ id, x, y, width, height }); const rgba = view.getUint32(offset + 8, true); context.fillStyle = `rgb(${(rgba >>> 16) & 255} ${(rgba >>> 8) & 255} ${rgba & 255})`; context.fillRect(x, y, width, height); } }).catch(() => {}); return () => { alive = false; }; }, [generation]); const pick = (event: MouseEvent<HTMLCanvasElement>) => { const element = canvas.current; if (!element) return; const bounds = element.getBoundingClientRect(); const x = (event.clientX - bounds.left) * element.width / bounds.width; const y = (event.clientY - bounds.top) * element.height / bounds.height; const hit = [...cells.current].reverse().find((cell) => x >= cell.x && x <= cell.x + cell.width && y >= cell.y && y <= cell.y + cell.height); if (hit) void invoke<{ name: string }[]>("get_names", { generation, nodeIds: [hit.id] }).then((names) => setSelected(names[0]?.name ?? "")); }; return <><canvas ref={canvas} className="treemap" width="900" height="440" aria-label="Disk space treemap" onClick={pick} />{selected && <p className="treemap-selection">Selected: {selected}</p>}</>; }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; const units = ["KB", "MB", "GB", "TB"]; let value = bytes; let unit = -1; while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; } return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`; }
function EmptyView({ title }: { title: string }) { return <div className="empty-state compact"><div className="empty-icon">◫</div><h1>{title}</h1><p>This view becomes available once a scan is complete.</p></div>; }
export default App;
