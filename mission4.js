
const STORAGE_KEY = "missionStartMission4V1";

const TOTAL_GO = 24;
const TOTAL_NOGO = 6;
const SIGNAL_DURATION = 1000;
const BREAK_DURATION = 700;

const welcomeScreen = document.getElementById("welcomeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultsScreen = document.getElementById("resultsScreen");
const redLight = document.getElementById("redLight");
const greenLight = document.getElementById("greenLight");
const goButton = document.getElementById("goButton");
const signalText = document.getElementById("signalText");

let trials = [];
let trialIndex = 0;
let responses = [];
let responded = false;
let signalStartTime = 0;
let signalTimer = null;
let breakTimer = null;
let active = false;

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function clearTimers() {
  clearTimeout(signalTimer);
  clearTimeout(breakTimer);
}

document.getElementById("startButton")
  .addEventListener("click", startGame);

document.getElementById("restartButton")
  .addEventListener("click", () => {
    clearTimers();
    active = false;
    goButton.disabled = true;
    resultsScreen.hidden = true;
    gameScreen.hidden = true;
    welcomeScreen.hidden = false;
  });

goButton.addEventListener("click", recordResponse);

function startGame() {
  clearTimers();

  trials = shuffle([
    ...Array(TOTAL_GO).fill("go"),
    ...Array(TOTAL_NOGO).fill("nogo")
  ]);

  trialIndex = 0;
  responses = [];
  responded = false;
  active = false;

  welcomeScreen.hidden = true;
  resultsScreen.hidden = true;
  gameScreen.hidden = false;

  goButton.disabled = true;
  signalText.textContent = "Get ready...";

  redLight.className = "light";
  greenLight.className = "light";

  document.getElementById("feedback").textContent = "";

  breakTimer = setTimeout(showTrial, 1000);
}

function showTrial() {
  if (trialIndex >= trials.length) {
    finishGame();
    return;
  }

  const trial = trials[trialIndex];

  responded = false;
  active = true;

  redLight.className = "light";
  greenLight.className = "light";

  if (trial === "go") {
    greenLight.classList.add("greenActive");
    signalText.textContent = "GREEN";
  } else {
    redLight.classList.add("redActive");
    signalText.textContent = "RED";
  }

  document.getElementById("trialProgress").textContent =
    `Signal ${trialIndex + 1} of ${trials.length}`;

  document.getElementById("feedback").textContent = "";

  goButton.disabled = false;
  signalStartTime = performance.now();

  signalTimer = setTimeout(endTrial, SIGNAL_DURATION);
}

function recordResponse() {
  if (!active || responded) return;

  responded = true;

  const reactionTime =
    (performance.now() - signalStartTime) / 1000;

  responses.push({
    trial: trialIndex + 1,
    signal: trials[trialIndex],
    pressed: true,
    reactionTimeSeconds: Number(reactionTime.toFixed(3)),
    correct: trials[trialIndex] === "go"
  });

  goButton.disabled = true;
}

function endTrial() {
  active = false;
  goButton.disabled = true;

  if (!responded) {
    responses.push({
      trial: trialIndex + 1,
      signal: trials[trialIndex],
      pressed: false,
      reactionTimeSeconds: null,
      correct: trials[trialIndex] === "nogo"
    });
  }

  redLight.className = "light";
  greenLight.className = "light";
  signalText.textContent = "Wait...";

  trialIndex++;
  breakTimer = setTimeout(showTrial, BREAK_DURATION);
}

function average(values) {
  if (values.length === 0) return null;

  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function finishGame() {
  clearTimers();
  active = false;
  goButton.disabled = true;

  gameScreen.hidden = true;
  resultsScreen.hidden = false;

  const hits = responses.filter(
    r => r.signal === "go" && r.pressed
  ).length;

  const omissions = responses.filter(
    r => r.signal === "go" && !r.pressed
  ).length;

  const commissions = responses.filter(
    r => r.signal === "nogo" && r.pressed
  ).length;

  const correctRejections = responses.filter(
    r => r.signal === "nogo" && !r.pressed
  ).length;

  const goReactionTimes = responses
    .filter(r => r.signal === "go" && r.pressed)
    .map(r => r.reactionTimeSeconds);

  const meanRT = average(goReactionTimes);

  const overallAccuracy =
    ((hits + correctRejections) / trials.length) * 100;

  const goAccuracy = (hits / TOTAL_GO) * 100;

  const noGoAccuracy =
    (correctRejections / TOTAL_NOGO) * 100;

  const result = {
    version: 1,
    mission: "control-traffic",
    savedAt: new Date().toISOString(),
    completed: true,
    totalTrials: trials.length,
    goTrials: TOTAL_GO,
    noGoTrials: TOTAL_NOGO,
    hits,
    omissions,
    commissions,
    correctRejections,
    overallAccuracyPercent: Number(
      overallAccuracy.toFixed(2)
    ),
    goAccuracyPercent: Number(goAccuracy.toFixed(2)),
    noGoAccuracyPercent: Number(noGoAccuracy.toFixed(2)),
    meanGoRTSeconds: meanRT,
    responses: [...responses]
  };

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(result)
    );
  } catch (error) {
    console.warn("Could not save Mission 4 results:", error);
  }

  const resultsBox = document.getElementById("results");
  resultsBox.innerHTML = "";

  const lines = [
    `Correct Go responses: ${hits}/${TOTAL_GO}`,
    `Missed Go signals: ${omissions}`,
    `Incorrect Red responses: ${commissions}`,
    `Correct Red withholding: ${correctRejections}/${TOTAL_NOGO}`,
    `Overall accuracy: ${overallAccuracy.toFixed(1)}%`,
    `Average Go reaction time: ${
      meanRT === null
        ? "N/A"
        : meanRT.toFixed(3) + " seconds"
    }`
  ];

  lines.forEach(line => {
    const p = document.createElement("p");
    p.textContent = line;
    resultsBox.appendChild(p);
  });

  console.log("Mission 4 saved results:", result);
}
