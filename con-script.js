const currentLang = document.getElementById("currentLang");
const convertLang = document.getElementById("convertLang");
const convertBtn = document.getElementById("convertBtn");
const codeInput = document.getElementById("codeInput");
const resultContainer = document.getElementById("resultContainer");

codeInput.addEventListener("keydown", function (e) {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    // Insert 4 spaces for indentation (like Python IDLE)
    this.value =
      this.value.substring(0, start) +
      "    " +
      this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 4;
  }
});

// Prevent selecting the same language in both dropdowns
function updateDropdowns() {
  const current = currentLang.value;
  const convert = convertLang.value;

  // Update convertLang options
  Array.from(convertLang.options).forEach((opt) => {
    opt.disabled = opt.value && opt.value === current;
  });

  // Update currentLang options
  Array.from(currentLang.options).forEach((opt) => {
    opt.disabled = opt.value && opt.value === convert;
  });

  // Enable button only if both are selected and different
  convertBtn.disabled = !(
    current &&
    convert &&
    current !== convert &&
    codeInput.value.trim()
  );
}

currentLang.addEventListener("change", updateDropdowns);
convertLang.addEventListener("change", updateDropdowns);
codeInput.addEventListener("input", updateDropdowns);

let convertingInterval = null;

function showConvertingBubble(lang) {
  resultContainer.innerHTML = "";
  const bubble = document.createElement("div");
  bubble.className = "text-blue-400 text-lg mb-4";
  bubble.id = "convertingBubble";
  bubble.innerText = `Converting to ${lang}`;
  resultContainer.appendChild(bubble);

  let dotCount = 0;
  convertingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    bubble.innerText = `Converting to ${lang}` + ".".repeat(dotCount);
  }, 500);
}

function removeConvertingBubble() {
  clearInterval(convertingInterval);
  const bubble = document.getElementById("convertingBubble");
  if (bubble) bubble.remove();
}

convertBtn.addEventListener("click", async () => {
  const langLabel = convertLang.options[convertLang.selectedIndex].text;
  showConvertingBubble(langLabel);

  try {
    const res = await fetch("http://localhost:5000/convert-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: codeInput.value,
        from_lang: currentLang.value,
        to_lang: convertLang.value,
      }),
    });
    const data = await res.json();
removeConvertingBubble();
if (data.error) {
  resultContainer.innerHTML = `<div class="text-red-400">${data.error}</div>`;
} else {
  // Extract code block and language if present
  const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/;
  const match = (data.converted_code || "").match(codeBlockRegex);
  let lang = langLabel;
  let code = data.converted_code || "";
  if (match) {
    lang = match[1] ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : langLabel;
    code = match[2].trim();
  }
  resultContainer.innerHTML = `
    <div class="mb-2 font-semibold text-green-400">${lang}</div>
    <pre class="bg-gray-900 rounded p-4 overflow-x-auto text-sm"><code>${
      code.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }</code></pre>
  `;
}
  } catch (err) {
    removeConvertingBubble();
    resultContainer.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
  }
});