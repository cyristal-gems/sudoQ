import React, { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type Theme = "light" | "dark";
type Settings = { notesMode: boolean; theme: Theme };

type Cell = {
  value: number | null;
  given: boolean;
  notes: Set<number>;
  conflict: boolean;
};
type Board = Cell[];

const MAX_MISTAKES = 5;
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const cloneBoard = (board: Board): Board =>
  board.map((cell) => ({ ...cell, notes: new Set(cell.notes) }));
const idxToRC = (index: number) => ({ r: Math.floor(index / 9), c: index % 9 });
const rcToIdx = (r: number, c: number) => r * 9 + c;
const sameBox = (r1: number, c1: number, r2: number, c2: number) =>
  Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);
const arePeers = (a: number, b: number) => {
  const first = idxToRC(a);
  const second = idxToRC(b);
  return first.r === second.r || first.c === second.c || sameBox(first.r, first.c, second.r, second.c);
};
const shuffle = <T,>(items: T[]) => {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics are optional and unsupported on some browsers.
    }
  }
}
const tap = () => vibrate(10);
const wrong = () => vibrate([20, 40]);
const yay = () => vibrate([10, 10, 10]);

function isSafeNum(boardNums: number[], index: number, num: number): boolean {
  const { r, c } = idxToRC(index);
  for (let col = 0; col < 9; col++) if (boardNums[rcToIdx(r, col)] === num) return false;
  for (let row = 0; row < 9; row++) if (boardNums[rcToIdx(row, c)] === num) return false;

  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (boardNums[rcToIdx(br + row, bc + col)] === num) return false;
    }
  }
  return true;
}

function backtrackFill(boardNums: number[], index = 0): boolean {
  if (index === 81) return true;
  if (boardNums[index] !== 0) return backtrackFill(boardNums, index + 1);

  for (const num of shuffle(NUMBERS)) {
    if (isSafeNum(boardNums, index, num)) {
      boardNums[index] = num;
      if (backtrackFill(boardNums, index + 1)) return true;
      boardNums[index] = 0;
    }
  }
  return false;
}

function generateSolvedBoard(): number[] {
  const boardNums = Array(81).fill(0);
  for (let box = 0; box < 3; box++) {
    const nums = shuffle(NUMBERS);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        boardNums[rcToIdx(box * 3 + row, box * 3 + col)] = nums[row * 3 + col];
      }
    }
  }
  backtrackFill(boardNums);
  return boardNums;
}

function countSolutions(boardNums: number[], limit = 2): number {
  let solutions = 0;
  const nums = boardNums.slice();

  function backtrack(index = 0) {
    if (solutions >= limit) return;
    while (index < 81 && nums[index] !== 0) index++;
    if (index === 81) {
      solutions++;
      return;
    }

    for (const num of NUMBERS) {
      if (isSafeNum(nums, index, num)) {
        nums[index] = num;
        backtrack(index + 1);
        nums[index] = 0;
        if (solutions >= limit) return;
      }
    }
  }

  backtrack();
  return solutions;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: number[]; solution: number[] } {
  const solution = generateSolvedBoard();
  const targetClues: Record<Difficulty, number> = { easy: 40, medium: 34, hard: 28, expert: 24 };
  const puzzle = solution.slice();
  let clueCount = 81;

  for (const index of shuffle(range(81))) {
    const mirroredIndex = 80 - index;
    for (const candidateIndex of index === mirroredIndex ? [index] : [index, mirroredIndex]) {
      if (clueCount <= targetClues[difficulty]) break;
      const saved = puzzle[candidateIndex];
      if (saved === 0) continue;

      puzzle[candidateIndex] = 0;
      if (countSolutions(puzzle) === 1) {
        clueCount--;
      } else {
        puzzle[candidateIndex] = saved;
      }
    }
    if (clueCount <= targetClues[difficulty]) break;
  }

  return { puzzle, solution };
}

const LS_BEST = (level: Difficulty) => `sudoq_best_${level}`;
const LS_SETTINGS = "sudoq_settings";

function loadBest(level: Difficulty): number | null {
  const value = localStorage.getItem(LS_BEST(level));
  return value ? Number(value) : null;
}

function saveBest(level: Difficulty, ms: number) {
  localStorage.setItem(LS_BEST(level), String(ms));
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return { notesMode: false, theme: "light" };
    const parsed = JSON.parse(raw);
    return {
      notesMode: Boolean(parsed.notesMode),
      theme: parsed.theme === "dark" ? "dark" : "light",
    };
  } catch {
    return { notesMode: false, theme: "light" };
  }
}

function saveSettings(settings: Settings) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
}

function msToClock(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export default function App() {
  const initialSettings = loadSettings();
  const [level, setLevel] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Board>(() =>
    range(81).map(() => ({ value: null, given: false, notes: new Set(), conflict: false })),
  );
  const [solution, setSolution] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(initialSettings.notesMode);
  const [theme, setTheme] = useState<Theme>(initialSettings.theme);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [bestMs, setBestMs] = useState<number | null>(() => loadBest(level));
  const [paused, setPaused] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [solved, setSolved] = useState(false);
  const [showSolvedModal, setShowSolvedModal] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [lastWrong, setLastWrong] = useState<number | null>(null);

  const undoStack = useRef<Board[]>([]);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const wrongFlashRef = useRef<number | null>(null);

  const canPlay = !paused && !gameOver && !solved;
  const filledCells = useMemo(() => board.filter((cell) => cell.value != null).length, [board]);
  const remainingCells = 81 - filledCells;
  const progress = Math.round((filledCells / 81) * 100);
  const bestLabel = bestMs != null ? msToClock(bestMs) : "--:--";
  const selectedValue = selected == null ? null : board[selected]?.value ?? null;
  const isComplete = useMemo(
    () => solution != null && board.every((cell, index) => cell.value === solution[index]),
    [board, solution],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveSettings({ notesMode, theme });
  }, [notesMode, theme]);

  useEffect(() => {
    startNewPuzzle();
  }, [level]);

  useEffect(() => {
    if (!running || paused || gameOver || solved) return;

    function tick() {
      if (startRef.current != null) setElapsed(performance.now() - startRef.current);
      timerRef.current = requestAnimationFrame(tick);
    }

    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current != null) cancelAnimationFrame(timerRef.current);
    };
  }, [running, paused, gameOver, solved]);

  useEffect(() => {
    if (!isComplete || gameOver || solved) return;

    setRunning(false);
    setSolved(true);
    setShowSolvedModal(true);

    if (bestMs == null || elapsed < bestMs) {
      saveBest(level, elapsed);
      setBestMs(elapsed);
      setNewBest(true);
      yay();
    } else {
      tap();
    }
  }, [bestMs, elapsed, gameOver, isComplete, level, solved]);

  useEffect(() => {
    return () => {
      if (wrongFlashRef.current != null) window.clearTimeout(wrongFlashRef.current);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (event.key >= "1" && event.key <= "9") {
        placeNumber(Number(event.key));
        event.preventDefault();
      } else if (event.key === "Backspace" || event.key === "Delete") {
        erase();
        event.preventDefault();
      } else if (key === "n") {
        toggleNotesMode();
        event.preventDefault();
      } else if (key === "u") {
        undo();
        event.preventDefault();
      } else if (key === "h") {
        hint();
        event.preventDefault();
      } else if (key === "p") {
        togglePause();
        event.preventDefault();
      } else if (key === "r") {
        startNewPuzzle();
        event.preventDefault();
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        moveSelection(event.key);
        event.preventDefault();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, canPlay, elapsed, level, notesMode, paused, running, selected, solution, theme]);

  function startNewPuzzle() {
    const generated = generatePuzzle(level);
    const nextBoard: Board = generated.puzzle.map((num) => ({
      value: num === 0 ? null : num,
      given: num !== 0,
      notes: new Set<number>(),
      conflict: false,
    }));

    setBoard(markConflicts(nextBoard));
    setSolution(generated.solution);
    setSelected(null);
    setElapsed(0);
    setRunning(false);
    setPaused(false);
    setMistakes(0);
    setGameOver(false);
    setSolved(false);
    setShowSolvedModal(false);
    setNewBest(false);
    setLastWrong(null);
    startRef.current = null;
    undoStack.current = [];
    setBestMs(loadBest(level));
  }

  function markConflicts(sourceBoard: Board): Board {
    const next = cloneBoard(sourceBoard);
    next.forEach((cell) => {
      cell.conflict = false;
    });

    for (let index = 0; index < 81; index++) {
      const value = next[index].value;
      if (!value) continue;
      for (let peer = 0; peer < 81; peer++) {
        if (peer !== index && next[peer].value === value && arePeers(index, peer)) {
          next[index].conflict = true;
          next[peer].conflict = true;
        }
      }
    }

    return next;
  }

  function clearPeerNotes(nextBoard: Board, index: number, value: number) {
    for (let peer = 0; peer < 81; peer++) {
      if (arePeers(index, peer)) nextBoard[peer].notes.delete(value);
    }
  }

  function startTimerIfNeeded() {
    if (paused || gameOver || solved) return;
    if (!running) {
      startRef.current = performance.now() - elapsed;
      setRunning(true);
    }
  }

  function togglePause() {
    if (gameOver || solved || (!running && elapsed === 0)) return;

    if (paused) {
      startRef.current = performance.now() - elapsed;
      setRunning(true);
      setPaused(false);
    } else {
      setRunning(false);
      setPaused(true);
    }
    tap();
  }

  function toggleNotesMode() {
    if (!canPlay) return;

    setNotesMode((current) => {
      const next = !current;
      saveSettings({ notesMode: next, theme });
      return next;
    });
    tap();
  }

  function flashWrongCell(index: number) {
    if (wrongFlashRef.current != null) window.clearTimeout(wrongFlashRef.current);
    setLastWrong(index);
    wrongFlashRef.current = window.setTimeout(() => {
      setLastWrong((current) => (current === index ? null : current));
    }, 500);
  }

  function handleMistake(index: number) {
    setMistakes((current) => {
      const next = current + 1;
      if (next >= MAX_MISTAKES) {
        setGameOver(true);
        setRunning(false);
      }
      return next;
    });
    flashWrongCell(index);
    wrong();
  }

  function placeNumber(value: number) {
    if (selected == null || !canPlay) return;
    const cell = board[selected];
    if (cell.given) return;

    startTimerIfNeeded();

    if (!notesMode && solution && value !== solution[selected]) {
      handleMistake(selected);
      return;
    }

    const previous = cloneBoard(board);
    const next = cloneBoard(board);

    if (notesMode) {
      if (next[selected].notes.has(value)) next[selected].notes.delete(value);
      else next[selected].notes.add(value);
    } else {
      next[selected].value = value;
      next[selected].notes.clear();
      clearPeerNotes(next, selected, value);
    }

    undoStack.current.push(previous);
    setBoard(markConflicts(next));
    tap();
  }

  function erase() {
    if (selected == null || !canPlay) return;
    const cell = board[selected];
    if (cell.given) return;

    startTimerIfNeeded();
    const previous = cloneBoard(board);
    const next = cloneBoard(board);
    next[selected].value = null;
    undoStack.current.push(previous);
    setBoard(markConflicts(next));
    tap();
  }

  function undo() {
    if (!canPlay) return;
    const previous = undoStack.current.pop();
    if (previous) {
      setBoard(previous);
      tap();
    }
  }

  function hint() {
    if (!solution || !canPlay) return;
    const empties = range(81).filter((index) => board[index].value == null);
    if (empties.length === 0) return;

    startTimerIfNeeded();
    const index = empties[Math.floor(Math.random() * empties.length)];
    const value = solution[index];
    const previous = cloneBoard(board);
    const next = cloneBoard(board);
    next[index].value = value;
    next[index].notes.clear();
    clearPeerNotes(next, index, value);
    undoStack.current.push(previous);
    setBoard(markConflicts(next));
    setSelected(index);
    tap();
  }

  function moveSelection(key: string) {
    if (!canPlay) return;
    const current = selected ?? board.findIndex((cell) => !cell.given);
    if (current < 0) return;

    const { r, c } = idxToRC(current);
    const nextRow = key === "ArrowUp" ? (r + 8) % 9 : key === "ArrowDown" ? (r + 1) % 9 : r;
    const nextCol = key === "ArrowLeft" ? (c + 8) % 9 : key === "ArrowRight" ? (c + 1) % 9 : c;
    setSelected(rcToIdx(nextRow, nextCol));
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-50 via-white to-amber-50 p-3 text-zinc-900 dark:from-zinc-950 dark:via-[#10202a] dark:to-[#2a1f16] dark:text-zinc-100 sm:p-4">
      {solved && showSolvedModal && (
        <Modal>
          <h2 className="mb-1 text-2xl font-bold">Puzzle solved!</h2>
          <p className="mb-3 text-sm">
            Time: <span className="font-semibold">{msToClock(elapsed)}</span>
          </p>
          {newBest && <div className="soft mb-4 inline-block rounded-full px-3 py-1">New Best</div>}
          <div className="flex justify-center gap-2">
            <button onClick={startNewPuzzle} className="primary rounded-cute px-3 py-2 shadow-cute active:scale-95">
              New Puzzle
            </button>
            <button
              onClick={() => setShowSolvedModal(false)}
              className="rounded-cute border bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/70"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {gameOver && (
        <Modal>
          <h2 className="mb-2 text-xl font-semibold">Out of mistakes</h2>
          <p className="mb-4 text-sm">You reached {MAX_MISTAKES} mistakes.</p>
          <button onClick={startNewPuzzle} className="primary rounded-cute px-3 py-2 shadow-cute active:scale-95">
            New Puzzle
          </button>
        </Modal>
      )}

      <main className="mx-auto flex w-full max-w-[1040px] flex-col pb-36 sm:pb-32">
        <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-normal">sudoQ</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">A clean, cozy Sudoku board.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Difficulty"
              value={level}
              onChange={(event) => setLevel(event.target.value as Difficulty)}
              className="rounded-cute border border-zinc-200 bg-white/85 px-3 py-2 shadow-cute dark:border-zinc-700 dark:bg-zinc-950/85"
            >
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="primary rounded-cute px-3 py-2 shadow-cute active:scale-95" onClick={startNewPuzzle}>
              New Puzzle
            </button>
            <button
              className="rounded-cute border border-zinc-200 bg-white/85 px-3 py-2 shadow-cute active:scale-95 dark:border-zinc-700 dark:bg-zinc-950/85"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Time" value={msToClock(elapsed)}>
            <div className="mt-3 flex gap-2">
              <button
                title="Pause or resume"
                onClick={togglePause}
                disabled={gameOver || solved || (!running && elapsed === 0)}
                className="rounded-cute border border-zinc-200 bg-white/70 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:bg-zinc-950/70"
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                title="Restart"
                onClick={startNewPuzzle}
                className="rounded-cute border border-zinc-200 bg-white/70 px-3 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950/70"
              >
                Restart
              </button>
            </div>
          </StatCard>

          <StatCard label={`Best (${DIFFICULTY_LABELS[level]})`} value={bestLabel}>
            {newBest && <span className="soft mt-2 inline-block rounded-full px-2 py-0.5 text-[10px]">New Best</span>}
          </StatCard>

          <StatCard label="Mistakes" value={`${mistakes}/${MAX_MISTAKES}`}>
            <div className="mt-3 flex gap-1">
              {range(MAX_MISTAKES).map((index) => (
                <span
                  key={index}
                  className={[
                    "h-1.5 flex-1 rounded-full",
                    index < mistakes ? "bg-rose-500 dark:bg-rose-300" : "bg-zinc-200 dark:bg-zinc-700",
                  ].join(" ")}
                />
              ))}
            </div>
          </StatCard>

          <StatCard label="Progress" value={`${progress}%`}>
            <div className="mt-3 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
            </div>
          </StatCard>

          <StatCard label="Remaining" value={String(remainingCells)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex justify-center">
            <div className="relative select-none">
              <div
                className="grid grid-cols-9 grid-rows-9 overflow-hidden rounded-cute border-4 border-teal-500 bg-white/95 shadow-cute dark:border-cyan-300 dark:bg-zinc-950"
                style={{ width: "min(92vw, 640px)", height: "min(92vw, 640px)" }}
              >
                {range(81).map((index) => {
                  const cell = board[index];
                  const { r, c } = idxToRC(index);
                  const thickRight = (c + 1) % 3 === 0 && c !== 8;
                  const thickBottom = (r + 1) % 3 === 0 && r !== 8;
                  const isSelected = selected === index;
                  const isPeer = selected != null && arePeers(selected, index);
                  const isSameValue = selectedValue != null && cell.value === selectedValue;
                  const isWrongFlash = lastWrong === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Cell ${r + 1}, ${c + 1}${cell.value ? `, ${cell.value}` : ""}`}
                      aria-pressed={isSelected}
                      disabled={paused}
                      onClick={() => {
                        if (!paused) {
                          setSelected(index);
                          tap();
                        }
                      }}
                      className={[
                        "relative flex appearance-none items-center justify-center border-zinc-200/80 bg-transparent text-center outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-default dark:border-zinc-700",
                        thickRight ? "border-r-4 border-r-teal-500 dark:border-r-cyan-300" : "border-r",
                        thickBottom ? "border-b-4 border-b-teal-500 dark:border-b-cyan-300" : "border-b",
                        isSelected
                          ? "bg-amber-100 dark:bg-amber-400/20"
                          : isSameValue
                            ? "bg-cyan-50 dark:bg-cyan-400/15"
                            : isPeer
                              ? "bg-zinc-100/80 dark:bg-zinc-800/80"
                              : "",
                        cell.given ? "font-black text-zinc-950 dark:text-zinc-50" : "text-teal-700 dark:text-cyan-200",
                        cell.conflict || isWrongFlash ? "bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-200" : "",
                      ].join(" ")}
                    >
                      {cell.value ? (
                        <span className="text-xl sm:text-2xl md:text-3xl">{cell.value}</span>
                      ) : cell.notes.size > 0 ? (
                        <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-1 text-[9px] leading-none text-zinc-500 dark:text-zinc-300 sm:text-[11px]">
                          {NUMBERS.map((num) => (
                            <span key={num} className="flex items-center justify-center">
                              {cell.notes.has(num) ? num : ""}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {paused && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-cute bg-white/90 text-center backdrop-blur-sm dark:bg-zinc-950/90">
                  <div className="mb-3 text-2xl font-bold">Paused</div>
                  <button onClick={togglePause} className="primary rounded-cute px-4 py-2 shadow-cute active:scale-95">
                    Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <InfoPanel title="Selected" value={selected == null ? "--" : `${idxToRC(selected).r + 1}, ${idxToRC(selected).c + 1}`} />
            <InfoPanel title="Notes" value={notesMode ? "On" : "Off"} />
            <InfoPanel title="Level" value={DIFFICULTY_LABELS[level]} />
          </aside>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-teal-200/70 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-2 px-3 py-2 sm:flex-row sm:items-stretch">
          <div className="grid flex-1 grid-cols-9 gap-1 sm:gap-2">
            {NUMBERS.map((num) => (
              <button
                key={num}
                className="h-11 min-w-0 rounded-cute border border-zinc-200 bg-white/90 text-lg font-semibold shadow-cute active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:bg-zinc-950"
                onClick={() => placeNumber(num)}
                disabled={!canPlay || selected == null}
                aria-label={`Number ${num}`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:w-56">
            <IconBtn onClick={erase} label="Erase" disabled={!canPlay || selected == null}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M3 12l6-6h6l6 6-6 6H9z" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M9 16l-4-4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </IconBtn>
            <IconBtn onClick={undo} label="Undo" disabled={!canPlay || undoStack.current.length === 0}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M9 10H4V5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 19a8 8 0 0 0-8-8H4l5-5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </IconBtn>
            <IconBtn onClick={toggleNotesMode} label={notesMode ? "Notes On" : "Notes"} disabled={!canPlay} pressed={notesMode}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </IconBtn>
            <IconBtn onClick={hint} label="Hint" disabled={!canPlay}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 3 2 5 4 6h6c2-1 4-3 4-6a7 7 0 0 0-7-7z" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/55" />
      <div className="card relative z-10 w-full max-w-sm p-6 text-center">{children}</div>
    </div>
  );
}

function StatCard({ children, label, value }: { children?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card min-h-[104px] p-3">
      <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {children}
    </div>
  );
}

function InfoPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function IconBtn({
  children,
  disabled = false,
  label,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={[
        "flex h-14 flex-col items-center justify-center rounded-cute border border-zinc-200 bg-white/90 py-1 text-center shadow-cute active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:bg-zinc-950",
        pressed ? "border-teal-500 bg-cyan-50 text-teal-800 dark:bg-cyan-400/15 dark:text-cyan-100" : "",
      ].join(" ")}
    >
      <span className="flex h-6 items-center justify-center">{children}</span>
      <span className="mt-1 text-[10px] leading-none">{label}</span>
    </button>
  );
}
