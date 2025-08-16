// Coding tips array
const tips = [
  "Tip: Use meaningful variable names for better readability.",
  "Tip: Write comments to explain complex logic.",
  "Tip: Keep your functions short and focused.",
  "Tip: Use version control (like Git) for your projects.",
  "Tip: Test your code with different inputs.",
  "Tip: Avoid global variables when possible.",
  "Tip: Regularly refactor your code to improve quality.",
  "Tip: Handle exceptions gracefully.",
  "Tip: Use linters to catch common mistakes.",
  "Tip: Practice writing unit tests.",
  "Tip: Read error messages carefully—they often tell you the solution.",
  "Tip: Break big problems into smaller pieces.",
  "Tip: Consistent code formatting helps teams work together.",
  "Tip: Always close files and release resources.",
  "Tip: Learn to use your debugger effectively.",
];

// Show random tips while loading
let tipInterval;
function showLoadingTips() {
  const loadingTips = document.getElementById("loadingTips");
  let idx = Math.floor(Math.random() * tips.length);
  loadingTips.textContent = tips[idx];
  tipInterval = setInterval(() => {
    idx = (idx + 1) % tips.length;
    loadingTips.textContent = tips[idx];
  }, 3000);
}
function hideLoadingTips() {
  clearInterval(tipInterval);
  document.getElementById("loadingTips").style.display = "none";
}

function parseQuizText(quizText) {
  const questions = quizText
    .split(/\nQ:/)
    .filter(Boolean)
    .map((q, idx) => {
      if (idx === 0 && !quizText.startsWith("Q:")) q = "Q:" + q;
      else q = "Q:" + q;
      const qMatch = q.match(/Q:(.*?)\nA\)/s);
      const question = qMatch ? qMatch[1].trim() : "";
      const optionsMatch = q.match(/A\)(.*?)\nCorrect Answer:/s);
      let options = [];
      if (optionsMatch) {
        options = optionsMatch[1].split(/\n[B-D]\)/).map((opt, i) => {
          const label = String.fromCharCode(65 + i);
          return { label, text: opt.replace(/^[A-D]\)/, "").trim() };
        });
      }
      const correctMatch = q.match(/Correct Answer:\s*([A-D])/);
      const correct = correctMatch ? correctMatch[1] : "";
      const explanationMatch = q.match(/Explanation:(.*)/s);
      const explanation = explanationMatch ? explanationMatch[1].trim() : "";
      return { question, options, correct, explanation };
    });
  return questions.slice(0, 15);
}

function showGeneratingBubble() {
  const container = document.getElementById("quizContainer");
  container.innerHTML = "";
  const bubble = document.createElement("div");
  bubble.className = "text-blue-400 text-lg mb-4";
  bubble.id = "generatingBubble";
  bubble.innerText = "Generating Quiz";
  container.appendChild(bubble);

  let dotCount = 0;
  window.generatingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    bubble.innerText = "Generating Quiz" + ".".repeat(dotCount);
  }, 500);
}

function removeGeneratingBubble() {
  clearInterval(window.generatingInterval);
  const bubble = document.getElementById("generatingBubble");
  if (bubble) bubble.remove();
}

async function loadQuiz() {
  showLoadingTips();
  showGeneratingBubble();
  const res = await fetch("http://localhost:5000/generate-quiz");
  const data = await res.json();
  hideLoadingTips();
  removeGeneratingBubble();
  const container = document.getElementById("quizContainer");
  const submitBtn = document.getElementById("submitBtn");
  container.innerHTML = "";

  if (!data.quizzes || data.quizzes.length === 0) {
    container.innerHTML =
      "<p class='text-gray-400'>No quizzes found. Submit some code first.</p>";
    return;
  }

  const quizText = data.quizzes[0];
  const questions = parseQuizText(quizText);

  questions.forEach((q, idx) => {
    // Detect code block in question text: ```lang\ncode```
    const codeBlockRegex = /```(\w+)\s*([\s\S]*?)```/;
    const codeMatch = q.question.match(codeBlockRegex);

    let codeBlockHtml = "";
    let questionText = q.question;

    if (codeMatch) {
      const lang = codeMatch[1];
      const code = codeMatch[2].trim();
      questionText = questionText.replace(codeBlockRegex, "").trim();
      codeBlockHtml = `
        <div class="mb-2">
          <span class="block text-xs font-semibold text-blue-400 uppercase mb-1">${lang}</span>
          <pre class="bg-gray-900 rounded p-3 overflow-x-auto text-sm"><code>${code
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</code></pre>
        </div>
      `;
    }

    // Render options, checking for code blocks
    const optionsHtml = q.options
      .map((opt) => {
        const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/;
        const optCodeMatch = opt.text.match(codeBlockRegex);
        let optText = opt.text;
        let optCodeHtml = "";
        let labelClass = "flex items-center space-x-2 cursor-pointer"; // default for non-code

        if (optCodeMatch) {
          // If language is missing, treat as output
          const optLang = optCodeMatch[1]
            ? optCodeMatch[1].toUpperCase()
            : "OUTPUT";
          const optCode = optCodeMatch[2].trim();
          optText = optText.replace(codeBlockRegex, "").trim();
          optCodeHtml = `
        <div class="mt-1">
          <span class="block text-xs font-semibold text-blue-400 uppercase mb-1">${optLang}</span>
          <pre class="bg-gray-900 rounded p-2 overflow-x-auto text-xs mb-2"><code>${optCode
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</code></pre>
        </div>
      `;
          labelClass =
            "flex flex-col items-start space-y-1 cursor-pointer bg-gray-900 rounded p-2";
        }

        return optCodeMatch
          ? `<label class="${labelClass}">
            <div class="flex items-center space-x-2">
              <input type="radio" name="q${idx}" value="${opt.label}" class="form-radio text-blue-600 mt-0.5" />
              <span>${opt.label}) ${optText}</span>
            </div>
            ${optCodeHtml}
          </label>`
          : `<label class="${labelClass}">
            <input type="radio" name="q${idx}" value="${opt.label}" class="form-radio text-blue-600 mt-0.5" />
            <span>${opt.label}) ${optText}</span>
          </label>`;
      })
      .join("");

    const qDiv = document.createElement("div");
    qDiv.className = "bg-gray-800 p-4 rounded shadow space-y-2";
    qDiv.innerHTML = `
      <div class="font-semibold text-base">${idx + 1}. ${questionText}</div>
      ${codeBlockHtml}
      <div class="grid grid-cols-2 gap-4">
        ${optionsHtml}
      </div>
      <div class="text-green-400 mt-2 hidden explanation"></div>
    `;
    container.appendChild(qDiv);
  });

  submitBtn.classList.remove("hidden");
  submitBtn.disabled = false;
  submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  submitBtn.onclick = function () {
    const qDivs = container.querySelectorAll("div.bg-gray-800");
    questions.forEach((q, idx) => {
      const selected = container.querySelector(`input[name="q${idx}"]:checked`);
      const explanationDiv = qDivs[idx].querySelector(".explanation");
      if (!selected) {
        explanationDiv.textContent = `No answer selected. Correct: ${q.correct}`;
        explanationDiv.classList.remove(
          "hidden",
          "text-green-400",
          "text-red-400"
        );
        explanationDiv.classList.add("text-yellow-400");
      } else if (selected.value === q.correct) {
        explanationDiv.textContent = `Correct! ${q.explanation}`;
        explanationDiv.classList.remove(
          "hidden",
          "text-red-400",
          "text-yellow-400"
        );
        explanationDiv.classList.add("text-green-400");
      } else {
        explanationDiv.textContent = `Incorrect. Correct: ${q.correct}. ${q.explanation}`;
        explanationDiv.classList.remove(
          "hidden",
          "text-green-400",
          "text-yellow-400"
        );
        explanationDiv.classList.add("text-red-400");
      }
    });
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");
  };
}

loadQuiz();
