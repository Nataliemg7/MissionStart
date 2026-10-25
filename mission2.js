
const map = [
  "S....",
  ".#.#.",
  ".....",
  ".#.#.",
  "....G"
];

const STORAGE_KEY = "missionStartMission2V1";

const grid = document.getElementById("grid");
const feedback = document.getElementById("feedback");
const progress = document.getElementById("progress");

let row = 0;
let col = 0;
let moves = 0;
let barrierAttempts = 0;
let boundaryAttempts = 0;
let startTime = 0;
let firstMoveTime = null;
let finished = false;
let actionLog = [];

document.getElementById("startButton")
  .addEventListener("click", startGame);

document.getElementById("restartButton")
  .addEventListener("click", () => {
    document.getElementById("resultsScreen").hidden = true;
    document.getElementById("welcomeScreen").hidden = false;
  });

document.getElementById("upButton")
  .addEventListener("click", () => move(-1, 0));

document.getElementById("downButton")
  .addEventListener("click", () => move(1, 0));

document.getElementById("leftButton")
  .addEventListener("click", () => move(0, -1));

document.getElementById("rightButton")
  .addEventListener("click", () => move(0, 1));

function startGame() {
  row = 0;
  col = 0;
  moves = 0;
  barrierAttempts = 0;
  boundaryAttempts = 0;
  firstMoveTime = null;
  finished = false;
  actionLog = [];

  document.getElementById("welcomeScreen").hidden = true;
  document.getElementById("resultsScreen").hidden = true;
  document.getElementById("gameScreen").hidden = false;

  feedback.textContent = "Plan your route!";
  startTime = performance.now();

  drawGrid();
}

function drawGrid() {
  grid.innerHTML = "";

  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const type = map[r][c];

      if (type === "#") {
        cell.classList.add("wall");
        cell.textContent = "🚧";
      }

      if (type === "G") {
        cell.classList.add("goal");
        cell.textContent = "🏫";
      }

      if (r === row && c === col) {
        cell.classList.add("truckCell");
        cell.textContent = "🚚";
      }

      grid.appendChild(cell);
    }
  }

  progress.textContent =
    `Moves: ${moves} | Barrier attempts: ${barrierAttempts}`;
}

function move(rowChange, colChange) {
  if (finished) return;

  const newRow = row + rowChange;
  const newCol = col + colChange;

  const elapsed = (performance.now() - startTime) / 1000;

  const event = {
    timeSeconds: Number(elapsed.toFixed(3)),
    fromRow: row,
    fromCol: col,
    attemptedRow: newRow,
    attemptedCol: newCol
  };

  if (
    newRow < 0 ||
    newRow >= map.length ||
    newCol < 0 ||
    newCol >= map[0].length
  ) {
    boundaryAttempts++;

    actionLog.push({
      ...event,
      outcome: "boundary"
    });

    feedback.textContent = "You can't leave the map!";
    return;
  }

  if (map[newRow][newCol] === "#") {
    barrierAttempts++;

    actionLog.push({
      ...event,
      outcome: "barrier"
    });

    feedback.textContent =
      "There's a barrier! Choose another route.";

    drawGrid();
    return;
  }

  if (firstMoveTime === null) {
    firstMoveTime = elapsed;
  }

  row = newRow;
  col = newCol;
  moves++;

  actionLog.push({
    ...event,
    outcome: "moved",
    row,
    col
  });

  feedback.textContent = "Keep going!";
  drawGrid();

  if (map[row][col] === "G") {
    finishGame();
  }
}

function finishGame() {
  finished = true;

  const completionTime =
    (performance.now() - startTime) / 1000;

  const result = {
    version: 1,
    mission: "deliver-supplies",
    savedAt: new Date().toISOString(),
    completed: true,
    moves,
    barrierAttempts,
    boundaryAttempts,
    firstMoveSeconds:
      firstMoveTime === null
        ? null
        : Number(firstMoveTime.toFixed(3)),
    completionSeconds:
      Number(completionTime.toFixed(3)),
    actionLog: [...actionLog]
  };

  // Save results for the Teacher Dashboard
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(result)
    );
  } catch (error) {
    console.warn(
      "Could not save Mission 2 results:",
      error
    );
  }

  document.getElementById("gameScreen").hidden = true;
  document.getElementById("resultsScreen").hidden = false;

  const resultsBox = document.getElementById("results");
  resultsBox.innerHTML = "";

  const lines = [
    `Total moves: ${moves}`,
    `Barrier attempts: ${barrierAttempts}`,
    `Boundary attempts: ${boundaryAttempts}`,
    `Time to first valid move: ${
      firstMoveTime === null
        ? "N/A"
        : firstMoveTime.toFixed(2) + " seconds"
    }`,
    `Completion time: ${completionTime.toFixed(2)} seconds`
  ];

  lines.forEach(line => {
    const p = document.createElement("p");
    p.textContent = line;
    resultsBox.appendChild(p);
  });

  console.log("Mission 2 saved results:", result);
}
