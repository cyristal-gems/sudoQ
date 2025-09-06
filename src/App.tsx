import React, { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type Theme = 'light' | 'dark';

type Cell = { value: number | null; given: boolean; notes: Set<number>; conflict: boolean };
type Board = Cell[];

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const cloneBoard = (b: Board): Board => b.map((c) => ({ ...c, notes: new Set(c.notes) }));
const idxToRC = (i: number) => ({ r: Math.floor(i / 9), c: i % 9 });
const rcToIdx = (r: number, c: number) => r * 9 + c;
const sameBox = (r1: number, c1: number, r2: number, c2: number) =>
  Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);
const shuffle = <T,>(arr: T[]) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function vibrate(pattern: number | number[]) { if ('vibrate' in navigator) { try {(navigator as any).vibrate(pattern)} catch{} } }
const tap = () => vibrate(10);
const wrong = () => vibrate([20,40]);
const yay = () => vibrate([10,10,10]);

function isSafeNum(boardNums: number[], idx: number, num: number): boolean {
  const { r, c } = idxToRC(idx);
  for (let j = 0; j < 9; j++) if (boardNums[rcToIdx(r, j)] === num) return false;
  for (let i = 0; i < 9; i++) if (boardNums[rcToIdx(i, c)] === num) return false;
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (boardNums[rcToIdx(br + i, bc + j)] === num) return false;
  return true;
}

function backtrackFill(boardNums: number[], idx = 0): boolean {
  if (idx === 81) return true;
  if (boardNums[idx] !== 0) return backtrackFill(boardNums, idx + 1);
  for (const num of shuffle([1,2,3,4,5,6,7,8,9])) {
    if (isSafeNum(boardNums, idx, num)) { boardNums[idx] = num; if (backtrackFill(boardNums, idx + 1)) return true; boardNums[idx] = 0; }
  }
  return false;
}

function generateSolvedBoard(): number[] {
  const boardNums = Array(81).fill(0);
  for (let b = 0; b < 3; b++) {
    const nums = shuffle([1,2,3,4,5,6,7,8,9]);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const r = b * 3 + i, c = b * 3 + j;
      boardNums[rcToIdx(r, c)] = nums[i * 3 + j];
    }
  }
  backtrackFill(boardNums);
  return boardNums;
}

function countSolutions(boardNums: number[], limit = 2): number {
  let solutions = 0;
  const nums = boardNums.slice();
  function bt(idx = 0) {
    if (solutions >= limit) return;
    while (idx < 81 && nums[idx] !== 0) idx++;
    if (idx === 81) { solutions++; return; }
    for (const n of [1,2,3,4,5,6,7,8,9]) {
      if (isSafeNum(nums, idx, n)) { nums[idx] = n; bt(idx + 1); nums[idx] = 0; if (solutions >= limit) return; }
    }
  }
  bt(0);
  return solutions;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: number[]; solution: number[] } {
  const solution = generateSolvedBoard();
  const targetClues: Record<Difficulty, number> = { easy: 40, medium: 34, hard: 28, expert: 24 };
  const clues = targetClues[difficulty];
  const puzzle = solution.slice();
  const order = shuffle(range(81));
  for (const i of order) {
    const j = 80 - i;
    const toTry = [i]; if (j !== i) toTry.push(j);
    for (const k of toTry) {
      if (puzzle.filter((x) => x !== 0).length <= clues) break;
      const saved = puzzle[k]; if (saved === 0) continue;
      puzzle[k] = 0;
      if (countSolutions(puzzle, 2) !== 1) puzzle[k] = saved;
    }
    if (puzzle.filter((x) => x !== 0).length <= clues) break;
  }
  return { puzzle, solution };
}

const LS_BEST = (lvl: Difficulty) => `sudoq_best_${lvl}`;
const LS_SETTINGS = `sudoq_settings`;

function loadBest(lvl: Difficulty): number | null { const v = localStorage.getItem(LS_BEST(lvl)); return v ? Number(v) : null; }
function saveBest(lvl: Difficulty, ms: number) { localStorage.setItem(LS_BEST(lvl), String(ms)); }
function loadSettings() { try { const raw = localStorage.getItem(LS_SETTINGS); if (!raw) return { notesMode:false, theme:'light' }; const p = JSON.parse(raw); return { notesMode: !!p.notesMode, theme: (p.theme ?? 'light') as Theme }; } catch { return { notesMode:false, theme:'light' as Theme }; } }
function saveSettings(ns: { notesMode: boolean; theme: Theme }) { localStorage.setItem(LS_SETTINGS, JSON.stringify(ns)); }

export default function App() {
  const initial = loadSettings();
  const [level, setLevel] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Board>(() => range(81).map(() => ({ value:null, given:false, notes:new Set(), conflict:false })));
  const [solution, setSolution] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState<boolean>(initial.notesMode);
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [running, setRunning] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [bestMs, setBestMs] = useState<number | null>(() => loadBest(level));
  const [paused, setPaused] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [solved, setSolved] = useState<boolean>(false);
  const [newBest, setNewBest] = useState<boolean>(false);

  const undoStack = useRef<Board[]>([]);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ notesMode, theme });
  }, [theme, notesMode]);

  useEffect(() => {
    startNewPuzzle();
  }, [level]);

  function startNewPuzzle() {
    const g = generatePuzzle(level);
    const b: Board = g.puzzle.map((n) => ({ value: n === 0 ? null : n, given: n !== 0, notes: new Set<number>(), conflict: false }));
    setBoard(markConflicts(b));
    setSolution(g.solution);
    setSelected(null);
    setElapsed(0);
    setRunning(false);
    setPaused(false);
    setMistakes(0);
    setGameOver(false);
    setSolved(false);
    setNewBest(false);
    startRef.current = null;
    undoStack.current = [];
    setBestMs(loadBest(level));
  }

  function markConflicts(b: Board): Board {
    const next = cloneBoard(b); next.forEach((c) => (c.conflict = false));
    for (let i = 0; i < 81; i++) {
      const val = next[i].value; if (!val) continue;
      const { r, c } = idxToRC(i);
      for (let j = 0; j < 9; j++) { const idx = rcToIdx(r, j); if (idx !== i && next[idx].value === val) { next[i].conflict = true; next[idx].conflict = true; } }
      for (let r2 = 0; r2 < 9; r2++) { const idx = rcToIdx(r2, c); if (idx !== i && next[idx].value === val) { next[i].conflict = true; next[idx].conflict = true; } }
      const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
      for (let i2 = 0; i2 < 3; i2++) for (let j2 = 0; j2 < 3; j2++) {
        const idx = rcToIdx(br + i2, bc + j2);
        if (idx !== i && next[idx].value === val) { next[i].conflict = true; next[idx].conflict = true; }
      }
    }
    return next;
  }

  useEffect(() => {
    if (!running || paused || gameOver || solved) return;
    function tick() { if (startRef.current != null) setElapsed(performance.now() - startRef.current); timerRef.current = requestAnimationFrame(tick); }
    timerRef.current = requestAnimationFrame(tick);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [running, paused, gameOver, solved]);

  function startTimerIfNeeded() { if (!running) { startRef.current = performance.now() - elapsed; setRunning(true); } }
  function stopTimer() { setRunning(false); }

  const isComplete = useMemo(() => board.every((c) => c.value != null && !c.conflict), [board]);
  useEffect(() => {
    if (isComplete && !gameOver && !solved) {
      stopTimer();
      setSolved(true);
      const finalMs = elapsed;
      const oldBest = bestMs;
      if (oldBest == null || finalMs < oldBest) {
        saveBest(level, finalMs);
        setBestMs(finalMs);
        setNewBest(true);
        yay();
      } else {
        tap();
      }
    }
  }, [isComplete]);

  function handleMistake() {
    setMistakes(m => {
      const next = m + 1;
      if (next >= 5) { setGameOver(true); stopTimer(); }
      wrong();
      return next;
    });
  }

  function placeNumber(n: number) {
    if (selected == null || gameOver || solved) return;
    const cell = board[selected]; if (cell.given) return;
    startTimerIfNeeded();
    const prev = cloneBoard(board);
    const next = cloneBoard(board);
    if (notesMode) {
      const s = new Set(next[selected].notes);
      if (s.has(n)) s.delete(n); else s.add(n);
      next[selected].notes = s;
      tap();
    } else {
      if (solution && n !== solution[selected]) handleMistake();
      next[selected].value = n;
      next[selected].notes.clear();
      tap();
    }
    undoStack.current.push(prev);
    setBoard(markConflicts(next));
  }
  function erase() {
    if (selected == null || gameOver || solved) return;
    const cell = board[selected]; if (cell.given) return;
    startTimerIfNeeded();
    const prev = cloneBoard(board);
    const next = cloneBoard(board);
    next[selected].value = null;
    undoStack.current.push(prev);
    setBoard(markConflicts(next));
    tap();
  }
  function undo() { const prev = undoStack.current.pop(); if (prev) { setBoard(prev); tap(); } }
  function hint() {
    if (!solution || gameOver || solved) return;
    const empties = range(81).filter((i) => board[i].value == null);
    if (empties.length === 0) return;
    const i = empties[Math.floor(Math.random() * (empties.length))];
    const prev = cloneBoard(board);
    const next = cloneBoard(board);
    next[i].value = solution[i];
    next[i].notes.clear();
    undoStack.current.push(prev);
    setBoard(markConflicts(next));
    tap();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= "1" && e.key <= "9") { placeNumber(Number(e.key)); e.preventDefault(); }
      else if (e.key === "Backspace" || e.key === "Delete") { erase(); e.preventDefault(); }
      else if (e.key.toLowerCase() === "n") { setNotesMode(v => { const nv = !v; saveSettings({ notesMode: nv, theme }); return nv; }); e.preventDefault(); tap(); }
      else if (e.key.toLowerCase() === "u") { undo(); e.preventDefault(); }
      else if (e.key.toLowerCase() === "h") { hint(); e.preventDefault(); }
      else if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        if (selected == null) return;
        const { r, c } = idxToRC(selected);
        let nr = r, nc = c;
        if (e.key === "ArrowUp") nr = (r + 8) % 9;
        if (e.key === "ArrowDown") nr = (r + 1) % 9;
        if (e.key === "ArrowLeft") nc = (c + 8) % 9;
        if (e.key === "ArrowRight") nc = (c + 1) % 9;
        setSelected(rcToIdx(nr, nc));
        e.preventDefault();
      }
      else if (e.key.toLowerCase() === "p") { if (!running) return; setPaused(p=>!p); tap(); }
      else if (e.key.toLowerCase() === "r") { startNewPuzzle(); tap(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, selected, notesMode, solution, theme, elapsed, running, paused, gameOver, solved]);

  function msToClock(ms: number) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return (h > 0 ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  const bestLabel = bestMs != null ? msToClock(bestMs) : "—";

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 text-gray-900 dark:text-gray-100">
      {/* Solved modal */}
      {solved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 card p-6 w-[90vw] max-w-sm text-center">
            <h2 className="text-2xl font-bold mb-1">Puzzle solved!</h2>
            <p className="text-sm mb-3">Time: <span className="font-semibold">{msToClock(elapsed)}</span></p>
            {newBest && <div className="inline-block px-3 py-1 rounded-full soft mb-4">New Best ★</div>}
            <div className="flex justify-center gap-2">
              <button onClick={() => startNewPuzzle()} className="px-3 py-2 rounded-cute primary shadow-cute active:scale-95">New Puzzle</button>
              <button onClick={() => { (document.activeElement as HTMLElement)?.blur(); }} className="px-3 py-2 rounded-cute border bg-white/70 dark:bg-[#1d1b2a]/70">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Game over modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 card p-6 w-[90vw] max-w-sm text-center">
            <h2 className="text-xl font-semibold mb-2">Out of mistakes</h2>
            <p className="text-sm mb-4">You reached 5 mistakes. Try a new puzzle?</p>
            <button onClick={() => startNewPuzzle()} className="px-3 py-2 rounded-cute primary shadow-cute active:scale-95">New Puzzle</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1000px] pb-28">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">sudoQ</h1>
            <span className="text-xs px-2 py-1 rounded-full soft">React · TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Difficulty" value={level} onChange={(e) => setLevel(e.target.value as Difficulty)} className="px-3 py-2 rounded-cute border bg-white/80 dark:bg-[#1d1b2a]/80 shadow-cute">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
            <button className="px-3 py-2 rounded-cute primary shadow-cute active:scale-95" onClick={() => startNewPuzzle()}>New Puzzle</button>
            <button className="px-3 py-2 rounded-cute border bg-white/80 dark:bg-[#1d1b2a]/80 hover:bg-white shadow-cute active:scale-95" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="relative md:col-span-2 card p-3">
            <div className="text-xs opacity-60 mb-1">Time</div>
            <div className="text-2xl font-semibold">{msToClock(elapsed)}</div>
            <div className="absolute top-2 right-2 flex gap-2">
              <button title="Pause/Resume (P)" onClick={() => { if (!running) return; setPaused(p=>!p); tap(); }} className="px-3 py-1 text-xs rounded-cute border bg-white/70 dark:bg-[#1d1b2a]/70"> {paused ? 'Resume' : 'Pause'} </button>
              <button title="Restart (R)" onClick={() => { startNewPuzzle(); tap(); }} className="px-3 py-1 text-xs rounded-cute border bg-white/70 dark:bg-[#1d1b2a]/70">Restart</button>
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs opacity-60 mb-1">Best ({level})</div>
            <div className="text-2xl font-semibold flex items-center gap-2">
              {bestLabel}
              {newBest && <span className="text-[10px] px-2 py-0.5 rounded-full soft">New Best!</span>}
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs opacity-60 mb-1">Mistakes</div>
            <div className={`text-2xl font-semibold ${mistakes>=4?'text-rose-600 dark:text-rose-300':''}`}>{mistakes}/5</div>
          </div>
          <div className="card p-3 hidden md:flex items-center justify-center">
            <div className="text-xs opacity-70">Press <kbd>N</kbd> for Notes • <kbd>U</kbd> Undo • <kbd>H</kbd> Hint</div>
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_260px] gap-4">
          <div className="flex justify-center">
            <div className="relative select-none">
              <div className="grid grid-cols-9 grid-rows-9 border-4 border-rose-300 dark:border-violet-500 bg-white/80 dark:bg-[#1d1b2a] rounded-cute overflow-hidden shadow-cute" style={{ width: "min(92vw, 640px)", height: "min(92vw, 640px)" }}>
                {range(81).map((i) => {
                  const cell = board[i];
                  const { r, c } = idxToRC(i);
                  const thickRight = (c + 1) % 3 === 0 && c !== 8;
                  const thickBottom = (r + 1) % 3 === 0 && r !== 8;
                  const isSelected = selected === i;
                  const isPeer = selected != null && (() => {
                    const { r: sr, c: sc } = idxToRC(selected!);
                    return sr === r || sc === c || sameBox(sr, sc, r, c);
                  })();

                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      aria-label={`Cell ${r + 1},${c + 1}`}
                      onClick={() => { setSelected(i); tap(); }}
                      className={[
                        "relative flex items-center justify-center border-rose-100/60 dark:border-violet-700/40",
                        thickRight ? "border-r-4 border-rose-300 dark:border-violet-500" : "border-r",
                        thickBottom ? "border-b-4 border-rose-300 dark:border-violet-500" : "border-b",
                        isSelected ? "bg-rose-100/80 dark:bg-violet-900/60" : isPeer ? "bg-rose-50/80 dark:bg-violet-800/40" : "bg-transparent",
                        cell.given ? "font-semibold" : "",
                        cell.conflict ? "bg-rose-200/70 dark:bg-red-900/60" : "",
                        "cursor-pointer",
                      ].join(" ")}
                    >
                      {cell.value ? (
                        <span className="text-2xl md:text-3xl">{cell.value}</span>
                      ) : cell.notes.size > 0 ? (
                        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1 text-[10px] md:text-[12px] leading-none text-rose-800/80 dark:text-violet-200/90">
                          {range(9).map((n) => (
                            <div key={n} className="flex items-center justify-center">
                              {cell.notes.has(n + 1) ? n + 1 : ""}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column now just a cute tips card; removed checkbox pane entirely */}
          <div className="flex flex-col gap-3">
            <div className="card p-3">
              <div className="text-sm">Tips</div>
              <ul className="text-xs mt-1 space-y-1 opacity-80">
                <li>Toggle <strong>Notes</strong> with the pencil icon or <kbd>N</kbd>.</li>
                <li>Use <kbd>U</kbd> to undo, <kbd>H</kbd> for a hint.</li>
                <li>Pause with <kbd>P</kbd> · Restart with <kbd>R</kbd>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fixed keypad and actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/80 dark:bg-[#151323]/80 backdrop-blur border-rose-200/60 dark:border-violet-800/40">
        <div className="mx-auto max-w-[1000px] px-3 py-2">
          <div className="flex items-stretch justify-between gap-3">
            <div className="flex-1 overflow-x-auto">
              <div className="grid grid-cols-9 gap-2 min-w-[540px]">
                {Array.from({length:9},(_,i)=>i+1).map(n => (
                  <button key={n} className="py-3 rounded-cute border bg-white/80 dark:bg-[#1d1b2a]/90 hover:bg-white active:scale-95 shadow-cute"
                    onClick={() => placeNumber(n)} aria-label={`Number ${n}`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 w-52 text-center">
              <IconBtn onClick={erase} label="Erase">
                <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M3 12l6-6h6l6 6-6 6H9z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 16l-4-4 4-4" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              </IconBtn>
              <IconBtn onClick={undo} label="Undo">
                <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M9 10H4V5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M20 19a8 8 0 0 0-8-8H4l5-5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              </IconBtn>
              <IconBtn onClick={() => setNotesMode(v=>{ const nv=!v; saveSettings({ notesMode: nv, theme }); tap(); return nv; })} label={notesMode ? "Notes*":"Notes"}>
                <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              </IconBtn>
              <IconBtn onClick={hint} label="Hint">
                <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 3 2 5 4 6h6c2-1 4-3 4-6a7 7 0 0 0-7-7z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              </IconBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center rounded-cute border bg-white/80 dark:bg-[#1d1b2a]/90 hover:bg-white active:scale-95 shadow-cute py-1">
      <div className="flex items-center justify-center h-7">{children}</div>
      <div className="text-[10px] leading-none mt-1">{label}</div>
    </button>
  );
}
