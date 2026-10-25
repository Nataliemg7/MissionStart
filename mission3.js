
const STORAGE_KEY = "missionStartMission3V1";

const trials = [
  { rule: "colour", shape: "circle", colour: "red" },
  { rule: "colour", shape: "square", colour: "blue" },
  { rule: "colour", shape: "circle", colour: "blue" },
  { rule: "colour", shape: "square", colour: "red" },

  { rule: "shape", shape: "circle", colour: "blue" },
  { rule: "shape", shape: "square", colour: "red" },
  { rule: "shape", shape: "circle", colour: "red" },
  { rule: "shape", shape: "square", colour: "blue" },

  { rule: "colour", shape: "square", colour: "red" },
  { rule: "colour", shape: "circle", colour: "blue" },
  { rule: "colour", shape: "square", colour: "blue" },
  { rule: "colour", shape: "circle", colour: "red" },

  { rule: "shape", shape: "square", colour: "blue" },
  { rule: "shape", shape: "circle", colour: "red" },
  { rule: "shape", shape: "square", colour: "red" },
  { rule: "shape", shape: "circle", colour: "blue" }
];

let trialIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let trialStartTime = 0;
let responses = [];
let acceptingAnswer = false;

const welcomeScreen = document.getElementById("welcomeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultsScreen = document.getElementById("resultsScreen");

document.getElementById("startButton")
  .addEventListener("click", startGame);

document.getElementById("restartButton")
  .addEventListener("click", () => {
    resultsScreen.hidden = true;
    welcomeScreen.hidden = false;
  });

function startGame() {
  trialIndex = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  responses = [];

  welcomeScreen.hidden = true;
  resultsScreen.hidden = true;
  gameScreen.hidden = false;

  showTrial();
}

function showTrial() {
  if (trialIndex >= trials.length) {
    finishGame();
    return;
  }

  acceptingAnswer = false;

  const trial = trials[trialIndex];

  document.getElementById("trialProgress").textContent =
    `Trial ${trialIndex + 1} of ${trials.length}`;

  document.getElementById("ruleText").textContent =
    `Sort by ${trial.rule.toUpperCase()}`;

  const shape = document.getElementById("shape");

  shape.className = "";
  shape.classList.add(trial.shape, trial.colour);

  const buttons = document.getElementById("answerButtons");
  buttons.innerHTML = "";

  const options = trial.rule === "colour"
    ? ["red", "blue"]
    : ["circle", "square"];

  options.forEach(option => {
    const button = document.createElement("button");

    button.textContent =
      option.charAt(0).toUpperCase() + option.slice(1);

    button.addEventListener("click", () => answer(option));

    buttons.appendChild(button);
  });

  document.getElementById("feedback").textContent = "";

  trialStartTime = performance.now();
  acceptingAnswer = true;
}

function answer(option) {
  if (!acceptingAnswer) return;

  acceptingAnswer = false;

  const trial = trials[trialIndex];

  const reactionTime =
    (performance.now() - trialStartTime) / 1000;

  const correctOption = trial.rule === "colour"
    ? trial.colour
    : trial.shape;

  const isCorrect = option === correctOption;

  if (isCorrect) {
    correctAnswers++;
  } else {
    incorrectAnswers++;
  }

  const previousRule = trialIndex === 0
    ? null
    : trials[trialIndex - 1].rule;

  const switchTrial =
    previousRule !== null && previousRule !== trial.rule;

  responses.push({
    trial: trialIndex + 1,
    rule: trial.rule,
    switchTrial,
    shape: trial.shape,
    colour: trial.colour,
    answer: option,
    correct: isCorrect,
    reactionTimeSeconds: Number(reactionTime.toFixed(3))
  });

  trialIndex++;

  if (trialIndex < trials.length) {
    showTrial();
  } else {
    finishGame();
  }
}

function average(values) {
  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function finishGame() {
  acceptingAnswer = false;

  gameScreen.hidden = true;
  resultsScreen.hidden = false;

  const accuracy =
    (correctAnswers / trials.length) * 100;

  const correctResponses = responses.filter(
    response => response.correct
  );

  const meanRT = average(
    correctResponses.map(
      response => response.reactionTimeSeconds
    )
  );

  const switchResponses = responses.filter(
    response => response.switchTrial
  );

  const repeatResponses = responses.filter(
    response => !response.switchTrial && response.trial > 1
  );

  const switchCorrect = switchResponses.filter(
    response => response.correct
  );

  const repeatCorrect = repeatResponses.filter(
    response => response.correct
  );

  const switchAccuracy = switchResponses.length
    ? (switchCorrect.length / switchResponses.length) * 100
    : null;

  const repeatAccuracy = repeatResponses.length
    ? (repeatCorrect.length / repeatResponses.length) * 100
    : null;

  const meanSwitchRT = average(
    switchCorrect.map(
      response => response.reactionTimeSeconds
    )
  );

  const meanRepeatRT = average(
    repeatCorrect.map(
      response => response.reactionTimeSeconds
    )
  );

  const result = {
    version: 1,
    mission: "sort-materials",
    savedAt: new Date().toISOString(),
    completed: true,
    totalTrials: trials.length,
    correctAnswers,
    incorrectAnswers,
    accuracyPercent: Number(accuracy.toFixed(2)),
    meanCorrectRTSeconds: meanRT,
    switchTrials: switchResponses.length,
    switchAccuracyPercent: switchAccuracy,
    repeatTrials: repeatResponses.length,
    repeatAccuracyPercent: repeatAccuracy,
    meanSwitchCorrectRTSeconds: meanSwitchRT,
    meanRepeatCorrectRTSeconds: meanRepeatRT,
    responses: [...responses]
  };

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(result)
    );
  } catch (error) {
    console.warn("Could not save Mission 3 results:", error);
  }

  const resultsBox = document.getElementById("results");
  resultsBox.innerHTML = "";

  const lines = [
    `Correct answers: ${correctAnswers}/${trials.length}`,
    `Incorrect answers: ${incorrectAnswers}`,
    `Overall accuracy: ${accuracy.toFixed(1)}%`,
    `Average correct-response time: ${
      meanRT === null ? "N/A" : meanRT.toFixed(3) + " seconds"
    }`,
    `Switch-trial accuracy: ${
      switchAccuracy === null
        ? "N/A"
        : switchAccuracy.toFixed(1) + "%"
    }`,
    `Repeat-trial accuracy: ${
      repeatAccuracy === null
        ? "N/A"
        : repeatAccuracy.toFixed(1) + "%"
    }`
  ];

  lines.forEach(line => {
    const p = document.createElement("p");
    p.textContent = line;
    resultsBox.appendChild(p);
  });

  console.log("Mission 3 saved results:", result);
}
