
const STORAGE_KEY = "missionStartTeacherDraftV1";

const GAME_KEYS = {
  mission1: "missionStartMission1V1",
  mission2: "missionStartMission2V1",
  mission3: "missionStartMission3V1",
  mission4: "missionStartMission4V1"
};

const missions = [
  {
    id: "mission1",
    name: "🏠 Build the House",
    description: "Instruction-following and support comparisons"
  },
  {
    id: "mission2",
    name: "🚚 Deliver the Supplies",
    description: "Route planning and navigation"
  },
  {
    id: "mission3",
    name: "🔴 Sort the Materials",
    description: "Sorting accuracy and rule switching"
  },
  {
    id: "mission4",
    name: "🚦 Control the Traffic",
    description: "Go/No-Go responses"
  }
];

const observations = [
  "Needed instructions repeated",
  "Took time to begin the activity",
  "Was distracted during the activity",
  "Found it difficult when the rule changed",
  "Became frustrated or requested help",
  "Used helpful strategies independently"
];

const supports = [
  "Provide a visual checklist",
  "Give one instruction at a time",
  "Reduce background distractions",
  "Allow short movement breaks",
  "Provide a visual timer",
  "Offer a demonstration before starting",
  "Check understanding before independent work"
];

// ---------- GENERAL HELPERS ----------

function readGame(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to read game data:", error);
    return null;
  }
}

function getGameResults() {
  const m1 = readGame(GAME_KEYS.mission1);
  const m2 = readGame(GAME_KEYS.mission2);
  const m3 = readGame(GAME_KEYS.mission3);
  const m4 = readGame(GAME_KEYS.mission4);

  return {
    mission1:
      m1 && Array.isArray(m1.challenges) &&
      Array.isArray(m1.summaries) ? m1 : null,

    mission2:
      m2 && m2.completed === true &&
      typeof m2.moves === "number" ? m2 : null,

    mission3:
      m3 && m3.completed === true &&
      Array.isArray(m3.responses) ? m3 : null,

    mission4:
      m4 && m4.completed === true &&
      Array.isArray(m4.responses) ? m4 : null
  };
}

function formatNumber(value, digits = 2, suffix = "") {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits) + suffix
    : "N/A";
}

function addParagraph(parent, content, className) {
  const p = document.createElement("p");
  p.textContent = content;

  if (className) p.className = className;

  parent.appendChild(p);
}

function addHeading(parent, content, level = 3) {
  const heading = document.createElement(`h${level}`);
  heading.textContent = content;
  parent.appendChild(heading);
}

function makeCheckboxes(containerId, items, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  items.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${prefix}-${index}`;
    checkbox.value = item;

    const span = document.createElement("span");
    span.textContent = item;

    label.append(checkbox, span);
    container.appendChild(label);
  });
}

function getSelected(prefix, items) {
  return items.filter((item, index) =>
    document.getElementById(`${prefix}-${index}`).checked
  );
}

function collectData() {
  return {
    studentCode:
      document.getElementById("studentCode").value.trim(),

    sessionDate:
      document.getElementById("sessionDate").value,

    observations:
      getSelected("observation", observations),

    teacherNotes:
      document.getElementById("teacherNotes").value,

    supports:
      getSelected("support", supports),

    targetBehaviour:
      document.getElementById("targetBehaviour").value,

    reviewDate:
      document.getElementById("reviewDate").value
  };
}

// ---------- GAME PERFORMANCE ----------

function getMissionLines(id, game) {
  if (!game) return ["No linked game data yet"];

  if (id === "mission1") {
    return [
      `Challenges completed: ${game.completedChallenges}/9`,
      ...game.summaries.map(s =>
        `${s.name}: ${s.totalErrors} errors, ` +
        `${formatNumber(s.accuracy, 1, "%")} correct clicks, ` +
        `${formatNumber(s.meanTime, 2, " s")} average completion, ` +
        `${s.totalReviews} instruction reviews`
      )
    ];
  }

  if (id === "mission2") {
    return [
      "Delivery completed",
      `Total moves: ${game.moves}`,
      `Barrier attempts: ${game.barrierAttempts}`,
      `Boundary attempts: ${game.boundaryAttempts}`,
      `Time to first valid move: ${
        formatNumber(game.firstMoveSeconds, 2, " s")
      }`,
      `Completion time: ${
        formatNumber(game.completionSeconds, 2, " s")
      }`
    ];
  }

  if (id === "mission3") {
    return [
      `Correct answers: ${game.correctAnswers}/${game.totalTrials}`,
      `Overall accuracy: ${
        formatNumber(game.accuracyPercent, 1, "%")
      }`,
      `Average correct-response time: ${
        formatNumber(game.meanCorrectRTSeconds, 3, " s")
      }`,
      `Switch-trial accuracy: ${
        formatNumber(game.switchAccuracyPercent, 1, "%")
      } (${game.switchTrials} trials)`,
      `Repeat-trial accuracy: ${
        formatNumber(game.repeatAccuracyPercent, 1, "%")
      } (${game.repeatTrials} trials)`
    ];
  }

  if (id === "mission4") {
    return [
      `Correct Go responses: ${game.hits}/${game.goTrials}`,
      `Missed Go signals: ${game.omissions}`,
      `Incorrect Red responses: ${game.commissions}`,
      `Correct Red withholding: ${
        game.correctRejections
      }/${game.noGoTrials}`,
      `Overall accuracy: ${
        formatNumber(game.overallAccuracyPercent, 1, "%")
      }`,
      `Average correct Go reaction time: ${
        formatNumber(game.meanGoRTSeconds, 3, " s")
      }`
    ];
  }

  return [];
}

function showMissionCards() {
  const container = document.getElementById("missionCards");
  container.innerHTML = "";

  const games = getGameResults();

  missions.forEach(mission => {
    const card = document.createElement("div");
    card.className = "missionCard";

    addHeading(card, mission.name);
    addParagraph(card, mission.description);

    getMissionLines(mission.id, games[mission.id])
      .forEach(line => addParagraph(card, line));

    const game = games[mission.id];

    if (game && game.savedAt) {
      const date = new Date(game.savedAt);

      addParagraph(
        card,
        "Last completed: " +
        (Number.isNaN(date.getTime())
          ? "Unknown"
          : date.toLocaleString()),
        "status"
      );
    }

    container.appendChild(card);
  });
}

// ---------- STEP 15A: INTERPRETATIONS ----------

function getInterpretations(games) {
  const explanations = [];

  if (games.mission1) {
    const valid = games.mission1.summaries.filter(
      s => s.count === 3 &&
      typeof s.totalErrors === "number"
    );

    let finding =
      "The task compared three instruction formats.";

    if (valid.length === 3) {
      const minimum = Math.min(
        ...valid.map(s => s.totalErrors)
      );

      const lowest = valid.filter(
        s => s.totalErrors === minimum
      );

      finding = lowest.length === 1
        ? `The fewest incorrect attempts occurred with ` +
          `${lowest[0].name} (${minimum} attempts).`
        : "Two or more instruction formats had the " +
          "same lowest number of incorrect attempts.";
    }

    explanations.push({
      title: "🏠 Build the House",
      finding,
      caution:
        "The building sequences differed between conditions. " +
        "Practice, order and difficulty may affect results. " +
        "This comparison does not establish which format is best."
    });
  }

  if (games.mission2) {
    const g = games.mission2;

    explanations.push({
      title: "🚚 Deliver the Supplies",
      finding:
        `The route was completed in ${g.moves} moves, ` +
        `with ${g.barrierAttempts} barrier attempts and ` +
        `${g.boundaryAttempts} boundary attempts.`,
      caution:
        "This was one fixed puzzle, not a validated test " +
        "of planning ability. There is no reference score."
    });
  }

  if (games.mission3) {
    const g = games.mission3;

    explanations.push({
      title: "🔴 Sort the Materials",
      finding:
        `Overall accuracy was ` +
        `${formatNumber(g.accuracyPercent, 1, "%")}. ` +
        `Switch-trial accuracy was ` +
        `${formatNumber(g.switchAccuracyPercent, 1, "%")}, ` +
        `compared with ` +
        `${formatNumber(g.repeatAccuracyPercent, 1, "%")} ` +
        `on repeat trials.`,
      caution:
        "Only three switch trials were included. " +
        "Differences may reflect chance or task design, " +
        "not stable cognitive flexibility."
    });
  }

  if (games.mission4) {
    const g = games.mission4;

    explanations.push({
      title: "🚦 Control the Traffic",
      finding:
        `There were ${g.omissions} missed green signals ` +
        `out of ${g.goTrials}, and ${g.commissions} ` +
        `responses to red signals out of ${g.noGoTrials}.`,
      caution:
        "Performance can be influenced by understanding, " +
        "motor speed, timing and distraction. Six red trials " +
        "are too few for reliable individual assessment."
    });
  }

  return explanations;
}

function showInterpretations() {
  let section = document.getElementById(
    "interpretationSection"
  );

  if (!section) {
    section = document.createElement("section");
    section.id = "interpretationSection";
    section.className = "panel";

    const gamePanel =
      document.getElementById("missionCards").closest(".panel");

    gamePanel.insertAdjacentElement("afterend", section);
  }

  section.innerHTML = "";
  addHeading(section, "Understanding the Results", 2);

  addParagraph(
    section,
    "These descriptions explain recorded task performance. " +
    "They are not diagnoses or standardised scores."
  );

  const explanations = getInterpretations(getGameResults());

  if (!explanations.length) {
    addParagraph(section, "No completed game results available.");
  }

  explanations.forEach(item => {
    const card = document.createElement("div");
    card.className = "missionCard";

    addHeading(card, item.title);
    addParagraph(card, "What was recorded:");
    addParagraph(card, item.finding);
    addParagraph(card, "What to keep in mind:");
    addParagraph(card, item.caution);

    section.appendChild(card);
  });
}

// ---------- STEP 15B: SUPPORT SUGGESTIONS ----------

// Suggestions use teacher observations as the primary
// reason to consider an adjustment. Game results provide
// descriptive context only, not diagnostic evidence.

function getSuggestions(data, games) {
  const suggestions = [];
  const observed = new Set(data.observations);

  function suggest(title, support, reason, trial, monitor) {
    if (suggestions.some(s => s.support === support)) return;

    suggestions.push({
      title,
      support,
      reason,
      trial,
      monitor
    });
  }

  if (observed.has("Needed instructions repeated")) {
    let context =
      "The teacher observed that instructions needed repeating.";

    if (games.mission1) {
      const summaries = games.mission1.summaries;

      const checklist = summaries.find(
        s => s.type === "checklist"
      );

      if (checklist) {
        context +=
          ` During the visual checklist challenges, ` +
          `${checklist.totalErrors} incorrect attempts ` +
          `were recorded. This is descriptive context, ` +
          `not evidence that the checklist caused a change.`;
      }
    }

    suggest(
      "Visual instructions",
      "Provide a visual checklist",
      context,
      "Give the child a short checklist with two to four " +
      "clear steps during an ordinary classroom activity.",
      "Record how often instructions need repeating " +
      "and whether the activity is completed."
    );
  }

  if (observed.has("Took time to begin the activity")) {
    suggest(
      "Help with task initiation",
      "Give one instruction at a time",
      "The teacher observed a delay in starting the activity.",
      "Give one clear first step, check understanding, " +
      "and introduce the next step when appropriate.",
      "Record the time between giving the instruction " +
      "and beginning the activity."
    );
  }

  if (observed.has("Was distracted during the activity")) {
    suggest(
      "Reduce environmental distractions",
      "Reduce background distractions",
      "The teacher observed distraction during the activity.",
      "Offer a quieter workspace or reduce unnecessary " +
      "visual materials for a comparable classroom task.",
      "Record time on task and how often redirection " +
      "is needed."
    );
  }

  if (observed.has("Found it difficult when the rule changed")) {
    let context =
      "The teacher observed difficulty following a changed rule.";

    if (games.mission3) {
      context +=
        ` The sorting game recorded ` +
        `${formatNumber(
          games.mission3.switchAccuracyPercent, 1, "%"
        )} accuracy on three rule-change trials. ` +
        `This small sample cannot establish a difficulty.`;
    }

    suggest(
      "Make changes predictable",
      "Offer a demonstration before starting",
      context,
      "Before changing an activity rule, explain the new " +
      "rule and demonstrate one example.",
      "Record how many reminders or examples are needed " +
      "after the rule changes."
    );
  }

  if (observed.has("Became frustrated or requested help")) {
    suggest(
      "Support engagement and recovery",
      "Allow short movement breaks",
      "The teacher observed frustration or requests for help.",
      "Offer a brief, predictable break or supportive " +
      "check-in when appropriate, then help restart the task.",
      "Record whether the child returns to the activity " +
      "and what support was helpful."
    );
  }

  if (observed.has("Used helpful strategies independently")) {
    suggest(
      "Build on existing strategies",
      "Check understanding before independent work",
      "The teacher observed independent strategy use.",
      "Ask the child which strategy helped and offer " +
      "opportunities to use it in similar classroom tasks.",
      "Record whether the strategy is used independently " +
      "across different activities."
    );
  }

  return suggestions;
}

function showSuggestions() {
  let section = document.getElementById("suggestionSection");

  if (!section) {
    section = document.createElement("section");
    section.id = "suggestionSection";
    section.className = "panel";

    const interpretation =
      document.getElementById("interpretationSection");

    interpretation.insertAdjacentElement("afterend", section);
  }

  section.innerHTML = "";

  addHeading(section, "Personalised Classroom Suggestions", 2);

  addParagraph(
    section,
    "These are optional adjustments to consider based on " +
    "teacher observations. Game scores provide context " +
    "but do not determine support needs."
  );

  const data = collectData();
  const suggestions = getSuggestions(data, getGameResults());

  if (!suggestions.length) {
    addParagraph(
      section,
      "Select one or more Teacher Observations below " +
      "to generate possible classroom adjustments."
    );
    return;
  }

  suggestions.forEach(s => {
    const card = document.createElement("div");
    card.className = "missionCard";

    addHeading(card, "💡 " + s.title);

    addParagraph(card, "Why consider this?");
    addParagraph(card, s.reason);

    addParagraph(card, "What to try:");
    addParagraph(card, s.trial);

    addParagraph(card, "What to monitor:");
    addParagraph(card, s.monitor);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Add to Support Plan";

    const supportIndex = supports.indexOf(s.support);

    const checkbox = document.getElementById(
      `support-${supportIndex}`
    );

    if (checkbox && checkbox.checked) {
      button.textContent = "Already in Support Plan";
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      if (!checkbox) return;

      checkbox.checked = true;
      showSuggestions();

      document.getElementById("saveMessage").textContent =
        "Support added. Click Save Draft to keep your selection.";
    });

    card.appendChild(button);
    section.appendChild(card);
  });

  addParagraph(
    section,
    "Choose supports using professional judgement and " +
    "the child's preferences. These suggestions have not " +
    "been validated as an automated recommendation system.",
    "hint"
  );
}

// ---------- DRAFT MANAGEMENT ----------

function restoreCheckboxes(prefix, items, selected) {
  items.forEach((item, index) => {
    document.getElementById(
      `${prefix}-${index}`
    ).checked = selected.includes(item);
  });
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);

    [
      "studentCode",
      "sessionDate",
      "teacherNotes",
      "targetBehaviour",
      "reviewDate"
    ].forEach(id => {
      document.getElementById(id).value = data[id] || "";
    });

    restoreCheckboxes(
      "observation",
      observations,
      data.observations || []
    );

    restoreCheckboxes(
      "support",
      supports,
      data.supports || []
    );
  } catch (error) {
    console.warn("Unable to restore teacher draft:", error);
  }
}

function saveDraft() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(collectData())
    );

    document.getElementById("saveMessage").textContent =
      "Draft saved in this browser.";
  } catch (error) {
    document.getElementById("saveMessage").textContent =
      "Unable to save draft.";
  }
}

// ---------- DOWNLOAD REPORT ----------

function downloadReport() {
  const data = collectData();
  const games = getGameResults();
  const interpretations = getInterpretations(games);
  const suggestions = getSuggestions(data, games);

  const lines = [
    "MISSION START - TEACHER SESSION REPORT",
    "",
    `Pupil code: ${data.studentCode || "Not entered"}`,
    `Session date: ${data.sessionDate || "Not entered"}`,
    "",
    "GAME RESULTS"
  ];

  missions.forEach(mission => {
    lines.push(
      "",
      mission.name,
      ...getMissionLines(mission.id, games[mission.id])
    );
  });

  lines.push("", "UNDERSTANDING THE RESULTS");

  if (!interpretations.length) {
    lines.push("No completed missions available");
  }

  interpretations.forEach(item => {
    lines.push(
      "",
      item.title,
      item.finding,
      "Caution: " + item.caution
    );
  });

  lines.push(
    "",
    "TEACHER OBSERVATIONS",
    ...(
      data.observations.length
        ? data.observations.map(s => "- " + s)
        : ["None selected"]
    ),
    "",
    "ADDITIONAL NOTES",
    data.teacherNotes || "None",
    "",
    "SUGGESTED CLASSROOM ADJUSTMENTS"
  );

  if (!suggestions.length) {
    lines.push("No suggestions generated");
  }

  suggestions.forEach(s => {
    lines.push(
      "",
      s.title,
      "Reason: " + s.reason,
      "Trial: " + s.trial,
      "Monitor: " + s.monitor
    );
  });

  lines.push(
    "",
    "TEACHER-SELECTED SUPPORT PLAN",
    ...(
      data.supports.length
        ? data.supports.map(s => "- " + s)
        : ["No supports selected"]
    ),
    "",
    "TARGET BEHAVIOUR",
    data.targetBehaviour || "Not specified",
    "",
    `Review date: ${data.reviewDate || "Not specified"}`,
    "",
    "IMPORTANT NOTES",
    "Educational prototype only; not a diagnostic assessment.",
    "Recommendations are tentative and require teacher judgement.",
    "Game results are not validated or standardised.",
    "Only the latest run of each mission is displayed.",
    "Game results are not linked to the entered pupil code.",
    "Confirm all results belong to the intended test session."
  );

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeCode = (data.studentCode || "session")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  link.href = url;
  link.download = `mission_start_${safeCode}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  document.getElementById("saveMessage").textContent =
    "Report downloaded.";
}

function clearDraft() {
  if (!confirm(
    "Clear teacher observations and selected supports? " +
    "Game results will remain."
  )) return;

  localStorage.removeItem(STORAGE_KEY);

  document.querySelectorAll(
    'input[type="text"], input[type="date"], textarea'
  ).forEach(element => {
    element.value = "";
  });

  document.querySelectorAll(
    'input[type="checkbox"]'
  ).forEach(element => {
    element.checked = false;
  });

  showSuggestions();

  document.getElementById("saveMessage").textContent =
    "Teacher draft cleared. Game results retained.";
}

// ---------- INITIALISE ----------

makeCheckboxes(
  "observationList",
  observations,
  "observation"
);

makeCheckboxes(
  "supportList",
  supports,
  "support"
);

restoreDraft();

showMissionCards();
showInterpretations();
showSuggestions();

// Update suggestions whenever observations change
document.getElementById("observationList")
  .addEventListener("change", showSuggestions);

// Update button status when supports change
document.getElementById("supportList")
  .addEventListener("change", showSuggestions);

document.getElementById("saveButton")
  .addEventListener("click", saveDraft);

document.getElementById("downloadButton")
  .addEventListener("click", downloadReport);

document.getElementById("clearButton")
  .addEventListener("click", clearDraft);
