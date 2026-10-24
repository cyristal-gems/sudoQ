# sudoQ
**sudoQ** is a Sudoku puzzle game with four difficulty levels: **Easy, Medium, Hard, Expert**. The goal is to fill the 9×9 grid so that each row, column, and 3×3 box contains the numbers 1–9 with no duplicates. You can track your best times, follow your progress, use notes and hints, and play comfortably on any device with intuitive touch, mouse, and keyboard controls.

---

## ✨ Features

- **Four levels**: Easy, Medium, Hard, Expert.  
- **Timer & Best Score**: Tracks your fastest time per level and celebrates new records with a “New Best!” badge.  
- **Mistake Counter**: Wrong guesses count toward the 5-mistake limit without filling bad numbers into the board.  
- **Smart Notes**: Notes mode supports pencil marks, and notes are cleaned from related cells when numbers are placed.  
- **Undo, Erase, Notes & Hints** buttons: All accessible via icons, keyboard, or touch.  
- **Pause Mode**: Pausing stops the timer and hides the board until you resume.  
- **Progress Tracking**: Shows completion percentage and remaining cells.  
- **Cross-platform**: Play seamlessly on desktop, tablet, or mobile devices.  
- **Light & Dark Mode**: Fresh sky/amber light mode with teal accents and a deep cyan-toned dark mode.

## 🎮 How To Play:  

### 📱 Mobile & Tablet (Touch)
- **Select a cell:** Tap any cell on the grid.
- **Place a number:** Tap a number on the bottom number bar (1–9).
- **Erase:** Tap the **Erase** icon.
- **Undo:** Tap the **Undo** icon.
- **Notes (pencil icon):** Tap to toggle Notes on/off, then tap numbers to add/remove pencil marks.
- **Hint:** Tap the **Hint** icon.
- **Pause/Restart:** Use the buttons in the header.
- **Theme:** Toggle **Light/Dark** mode from the header.
- *(Supported devices provide subtle haptic feedback on taps.)*

### ⌨️ Desktop & Laptop (Keyboard + Mouse)
- **Select a cell:** Click any cell on the grid.
- **Place a number:** Press **1–9**.
- **Erase:** **Delete** or **Backspace**.
- **Notes:** **N** to toggle Notes on/off.
- **Undo:** **U**
- **Hint:** **H**
- **Pause:** **P**
- **Restart:** **R**
- **Move:** **Arrow Keys** to navigate cells.
 
---

## 🛠 Tech Stack

- **React + TypeScript** — Core game logic and UI.  
- **TailwindCSS** — Styling, themes, and responsive design.  
- **Vite** — Fast development server and build tool.  
- **LocalStorage** — Store best times and user settings (notes mode, theme).  
- **Haptics (on mobile)** — Subtle feedback on taps for immersive play.  

---

## 🚀 Play the Game

👉 [sudoQ](https://sudo-q.vercel.app)

---

## 🔗 Connect
- **LinkedIn:** [linkedin.com/in/cyristalj](https://www.linkedin.com/in/cyristalj/)  
- **GitHub:** [github.com/cyristal-gems](https://github.com/cyristal-gems)

## Deploy on Vercel

1. Push the source changes to GitHub.
2. In Vercel, add a new project and import `cyristal-gems/sudoQ`.
3. Keep the root directory at the repository root (do not select `src`).
4. Use the Vite preset, `npm run build` as the build command, and `dist` as the output directory. These are also saved in `vercel.json`.
5. Deploy. Future pushes to the connected production branch will trigger a new deployment.

The default build serves assets from `/` for Vercel. For the existing GitHub Pages deployment under `/sudoQ/`, use `npm run build:pages` instead.

Correctly completed rows, columns, and 3×3 boxes show a teal ripple. Finishing the puzzle shows a gold wave across the board before the result dialog. Reduced-motion preferences are respected.
