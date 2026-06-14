# sudoQ

A modern, responsive Sudoku game built with **React + TypeScript + TailwindCSS**, designed to work beautifully on desktop, tablet, and mobile. **sudoQ** combines a clean Sudoku board with a fresh sky, amber, teal, and cyan color palette.

---

## 🎯 Game Summary

**sudoQ** is a Sudoku puzzle game with four difficulty levels: **Easy, Medium, Hard, Expert**. The goal is to fill the 9×9 grid so that each row, column, and 3×3 box contains the numbers 1–9 with no duplicates.

You can track your best times, follow your progress, use notes and hints, and play comfortably on any device with intuitive touch, mouse, and keyboard controls.

---

## 👀 Preview

<img width="1284" height="847" alt="Screenshot 2025-09-06 at 03 44 04" src="https://github.com/user-attachments/assets/429016b9-682b-4063-9e25-774a46a06962" />

<img width="1272" height="846" alt="Screenshot 2025-09-06 at 03 55 13" src="https://github.com/user-attachments/assets/5f6b5ca0-eee5-46e2-a79a-f9073b9df39d" />

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

👉 [sudoQ](https://cyristal-gems.github.io/sudoQ)  

---

## 🖥 Run The Game Locally

```bash
git clone https://github.com/cyristal-gems/sudoQ.git
cd sudoQ
npm install
npm run dev
```

---

## 📦 Build & Publish

```bash
npm run build        # Build the Vite app into dist/
npm run build:pages  # Build and sync the GitHub Pages files to the repo root
npm run preview      # Preview the production build locally
```

This repository is currently set up for GitHub Pages to serve the built files from the repo root. Before pushing visual or gameplay changes, run:

```bash
npm run build:pages
```

Then commit the updated root `index.html`, `assets/`, and `icon.png` files along with the source changes.

---

## 🔗 Connect
- **LinkedIn:** [linkedin.com/in/cyristalj](https://www.linkedin.com/in/cyristalj/)  
- **GitHub:** [github.com/cyristal-gems](https://github.com/cyristal-gems)
