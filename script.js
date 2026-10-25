
const screens = {
  welcome: document.getElementById('welcomeScreen'),
  game: document.getElementById('gameScreen'),
  between: document.getElementById('betweenScreen'),
  results: document.getElementById('resultsScreen')
};

const labels = {
  foundation: '🧱 Foundation',
  walls: '🏗️ Walls',
  roof: '🏠 Roof',
  door: '🚪 Door',
  windows: '🪟 Windows'
};

const conditions = [
  { type: 'standard', name: 'Standard Instructions' },
  { type: 'checklist', name: 'Visual Checklist' },
  { type: 'step', name: 'Step-by-Step Instructions' }
];

const sequences = [
  ['foundation', 'walls', 'roof', 'door'],
  ['foundation', 'walls', 'windows', 'roof'],
  ['foundation', 'walls', 'door', 'roof'],
  ['foundation', 'door', 'walls', 'roof'],
  ['walls', 'foundation', 'roof', 'windows'],
  ['foundation', 'windows', 'walls', 'roof'],
  ['walls', 'roof', 'foundation', 'door'],
  ['foundation', 'roof', 'walls', 'door'],
  ['walls', 'foundation', 'windows', 'roof']
];

let challenges = [];
let challengeIndex = 0;
let currentStep = 0;
let errors = 0;
let startTime = 0;
let firstActionTime = null;
let reviewCount = 0;
let instructionTimer = null;
let results = [];
let actionLog = [];

const reviewButton = document.getElementById('reviewButton');

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function showScreen(name) {
  Object.keys(screens).forEach(key => {
    screens[key].hidden = key !== name;
  });
}

function createChallenges() {
  const shuffledSequences = shuffle(sequences);
  const schedule = [];

  for (let block = 0; block < 3; block++) {
    schedule.push(...shuffle(conditions));
  }

  challenges = schedule.map((condition, index) => ({
    ...condition,
    order: shuffledSequences[index],
    number: index + 1
  }));
}

document.getElementById('startButton')
  .addEventListener('click', () => {
    createChallenges();
    challengeIndex = 0;
    results = [];
    startChallenge();
  });

document.getElementById('nextButton')
  .addEventListener('click', () => {
    challengeIndex++;

    if (challengeIndex < challenges.length) {
      startChallenge();
    } else {
      showResults();
    }
  });

document.getElementById('restartButton')
  .addEventListener('click', () => {
    clearTimeout(instructionTimer);
    showScreen('welcome');
  });

reviewButton.addEventListener('click', () => {
  reviewCount++;
  clearTimeout(instructionTimer);
  showFullInstructions();
  reviewButton.hidden = true;
});

function startChallenge() {
  clearTimeout(instructionTimer);

  if (challengeIndex >= challenges.length) {
    showResults();
    return;
  }

  showScreen('game');

  currentStep = 0;
  errors = 0;
  firstActionTime = null;
  reviewCount = 0;
  actionLog = [];

  const challenge = challenges[challengeIndex];

  document.getElementById('roundTitle').textContent =
    `Building Challenge ${challenge.number}`;

  document.getElementById('roundDescription').textContent =
    challenge.name;

  document.getElementById('buildingDisplay').textContent = '🏞️';
  document.getElementById('feedback').textContent = '';

  document.getElementById('progress').textContent =
    `Pieces placed: 0/${challenge.order.length}`;

  document.getElementById('challengeProgress').textContent =
    `Challenge ${challengeIndex + 1} of ${challenges.length}`;

  reviewButton.hidden = true;

  createPieceButtons(challenge);
  updateInstructions();

  startTime = performance.now();

  if (challenge.type === 'standard') {
    instructionTimer = setTimeout(() => {
      document.getElementById('instructionPanel').textContent =
        'Instructions hidden. You can review them if needed.';

      reviewButton.hidden = false;
    }, 8000);
  }
}

function createPieceButtons(challenge) {
  const container = document.getElementById('pieceButtons');
  container.innerHTML = '';

  shuffle(challenge.order).forEach(piece => {
    const button = document.createElement('button');

    button.textContent = labels[piece];
    button.dataset.piece = piece;

    button.addEventListener('click', () => choosePiece(piece));

    container.appendChild(button);
  });
}

function showFullInstructions() {
  const challenge = challenges[challengeIndex];

  document.getElementById('instructionPanel').textContent =
    'Building order: ' +
    challenge.order.map(piece => labels[piece]).join(' → ');
}

function updateInstructions() {
  const challenge = challenges[challengeIndex];
  const panel = document.getElementById('instructionPanel');

  panel.innerHTML = '';

  if (challenge.type === 'standard') {
    showFullInstructions();

  } else if (challenge.type === 'checklist') {
    const heading = document.createElement('strong');

    heading.textContent = 'Your building checklist:';
    panel.appendChild(heading);

    challenge.order.forEach((piece, index) => {
      const item = document.createElement('div');

      item.className = 'checklistItem';

      if (index < currentStep) {
        item.classList.add('completed');
      }

      item.textContent = `${index + 1}. ${labels[piece]}`;
      panel.appendChild(item);
    });

  } else if (challenge.type === 'step') {
    panel.textContent =
      'Your next step: ' + labels[challenge.order[currentStep]];
  }
}

function choosePiece(piece) {
  const challenge = challenges[challengeIndex];

  if (currentStep >= challenge.order.length) return;

  const elapsed = (performance.now() - startTime) / 1000;

  if (firstActionTime === null) {
    firstActionTime = elapsed;
  }

  const expected = challenge.order[currentStep];
  const correct = piece === expected;

  actionLog.push({
    piece,
    expected,
    timeSeconds: Number(elapsed.toFixed(2)),
    correct
  });

  if (correct) {
    currentStep++;

    document.getElementById('buildingDisplay').textContent =
      currentStep === challenge.order.length ? '🏡' : '🏗️';

    document.getElementById('progress').textContent =
      `Pieces placed: ${currentStep}/${challenge.order.length}`;

    document.querySelector(
      `[data-piece="${piece}"]`
    ).disabled = true;

    document.getElementById('feedback').textContent = 'Piece placed!';

    if (currentStep === challenge.order.length) {
      finishChallenge();

    } else if (challenge.type !== 'standard') {
      updateInstructions();
    }

  } else {
    errors++;

    document.getElementById('feedback').textContent =
      "That piece doesn't go next. Try another one.";
  }
}

function finishChallenge() {
  clearTimeout(instructionTimer);

  const challenge = challenges[challengeIndex];

  const completionTime =
    (performance.now() - startTime) / 1000;

  results.push({
    challenge: challenge.number,
    condition: challenge.name,
    conditionType: challenge.type,
    sequence: [...challenge.order],
    errors,
    correctSteps: currentStep,
    totalAttempts: actionLog.length,
    firstActionSeconds: Number(firstActionTime.toFixed(2)),
    completionSeconds: Number(completionTime.toFixed(2)),
    instructionReviews: reviewCount,
    actions: [...actionLog]
  });

  if (challengeIndex < challenges.length - 1) {
    document.getElementById('betweenMessage').textContent =
      `Challenge ${challengeIndex + 1} of ${challenges.length} complete!`;

    document.getElementById('nextButton').textContent =
      'Next Building Challenge';

    showScreen('between');

  } else {
    showResults();
  }
}

function showResults() {
  showScreen('results');

  const container = document.getElementById('results');
  const chart = document.getElementById('errorChart');

  container.innerHTML = '';
  chart.innerHTML = '';

  const summaries = conditions.map(condition => {
    const data = results.filter(
      result => result.conditionType === condition.type
    );

    const totalErrors = data.reduce(
      (sum, result) => sum + result.errors, 0
    );

    const totalAttempts = data.reduce(
      (sum, result) => sum + result.totalAttempts, 0
    );

    const correctAttempts = data.reduce(
      (sum, result) => sum + result.correctSteps, 0
    );

    const meanTime = data.length
      ? data.reduce(
          (sum, result) => sum + result.completionSeconds, 0
        ) / data.length
      : 0;

    const totalReviews = data.reduce(
      (sum, result) => sum + result.instructionReviews, 0
    );

    return {
      ...condition,
      count: data.length,
      totalErrors,
      meanTime,
      accuracy: totalAttempts
        ? (100 * correctAttempts) / totalAttempts
        : 0,
      totalReviews
    };
  });

  const maxErrors = Math.max(
    1,
    ...summaries.map(summary => summary.totalErrors)
  );

  summaries.forEach(summary => {
    const row = document.createElement('div');
    row.className = 'chartRow';

    const label = document.createElement('div');
    label.className = 'chartLabel';
    label.textContent = summary.name;

    const track = document.createElement('div');
    track.className = 'chartTrack';

    const bar = document.createElement('div');
    bar.className = 'chartBar';

    bar.style.width =
      `${100 * summary.totalErrors / maxErrors}%`;

    track.appendChild(bar);

    const value = document.createElement('div');
    value.className = 'chartValue';
    value.textContent =
      `${summary.totalErrors} incorrect attempts`;

    row.append(label, track, value);
    chart.appendChild(row);

    const card = document.createElement('div');
    card.className = 'resultCard';

    const heading = document.createElement('h3');
    heading.textContent = summary.name;
    card.appendChild(heading);

    [
      `Challenges completed: ${summary.count}/3`,
      `Incorrect attempts: ${summary.totalErrors}`,
      `Correct-click percentage: ${summary.accuracy.toFixed(1)}%`,
      `Average completion time: ${summary.meanTime.toFixed(2)} seconds`,
      `Instruction reviews: ${summary.totalReviews}`
    ].forEach(line => {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      card.appendChild(paragraph);
    });

    container.appendChild(card);
  });

  // Save the complete Mission 1 data for the teacher dashboard
  const payload = {
    version: 1,
    mission: 'build-house',
    savedAt: new Date().toISOString(),
    completedChallenges: results.length,
    challenges: results,
    summaries
  };

  try {
    localStorage.setItem(
      'missionStartMission1V1',
      JSON.stringify(payload)
    );
  } catch (error) {
    console.warn('Could not save Mission 1 results:', error);
  }

  console.log('Mission 1 results:', payload);
}

// Download Mission 1 data as a CSV file
document.getElementById('downloadButton')
  .addEventListener('click', () => {
    if (!results.length) return;

    const rows = [
      [
        'Challenge',
        'Condition',
        'Sequence',
        'IncorrectAttempts',
        'TotalAttempts',
        'TimeToFirstActionSeconds',
        'CompletionSeconds',
        'InstructionReviews'
      ],
      ...results.map(result => [
        result.challenge,
        result.condition,
        result.sequence.join(' > '),
        result.errors,
        result.totalAttempts,
        result.firstActionSeconds,
        result.completionSeconds,
        result.instructionReviews
      ])
    ];

    const escapeCSV = value =>
      '"' + String(value).replace(/"/g, '""') + '"';

    const csv = rows
      .map(row => row.map(escapeCSV).join(','))
      .join('\r\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'mission_start_results.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
