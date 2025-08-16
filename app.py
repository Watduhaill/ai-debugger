# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2025, CodeSage Team

from flask import Flask, request, jsonify
from flask_cors import CORS 
import google.generativeai as genai
import os
import csv

app = Flask(__name__)
CORS(app)


GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "Your_API_Key")
BUG_LOG_FILE = "bug_log.csv"

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-pro-vision-latest",
    "gemini-1.0-pro",
    "gemini-1.0-pro-vision-latest"
]

def save_bug_summary(summary):
    with open(BUG_LOG_FILE, "a", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([summary])

def read_bug_log():
    if not os.path.exists(BUG_LOG_FILE):
        return []
    with open(BUG_LOG_FILE, "r", encoding='utf-8') as f:
        return [row[0] for row in csv.reader(f) if row]

@app.route('/explain-code', methods=['POST'])
def explain_code():
    data = request.get_json()
    code = data.get('code', '')
    if not code:
        return jsonify({'error': 'No code provided.'}), 400

    genai.configure(api_key=GEMINI_API_KEY)
    explanation = None
    last_error = None

    # Try each model for explanation
    for model_name in GEMINI_MODELS:
        try:
            model_instance = genai.GenerativeModel(model_name)
            prompt = (
                "You are an expert code reviewer. Here is a code snippet:\n\n"
                f"{code}\n\n"
                "Please do the following:\n"
                "1. Identify and list each mistake, bug, or bad practice as a separate bullet point.\n"
                "2. If there are no mistakes, reply with 'No mistakes found.'\n"
                "3. Do NOT ask for more information. Only analyze the code above."
            )

            response = model_instance.generate_content([{"text": prompt}])

            explanation = response.text if hasattr(response, 'text') else "No explanation returned."
            break
        except Exception as e:
            last_error = str(e)
            continue

    if not explanation:
        return jsonify({'error': f'All models failed. Last error: {last_error}'}), 500

    # Extract bullet points (mistakes)
    mistakes = []
    for line in explanation.splitlines():
        if line.strip().startswith(("-", "*")):
            mistakes.append(line.strip("-* ").strip())
    if not mistakes and "no mistakes" not in explanation.lower():
        mistakes = [explanation]

    # For each mistake, get a short summary and save to CSV
    summaries = []
    for mistake in mistakes:
        if not mistake or "no mistakes" in mistake.lower():
            continue
        summary_prompt = f"Summarize this bug in 3-5 words, e.g., 'missing semicolon':\n{mistake}"
        summary = None
        for model_name in GEMINI_MODELS:
            try:
                model_instance = genai.GenerativeModel(model_name)
                summary_resp = model_instance.generate_content([{"text": summary_prompt}])
                summary = summary_resp.text.strip() if hasattr(summary_resp, 'text') else mistake[:30]
                break
            except Exception:
                continue
        if summary:
            save_bug_summary(summary)
            summaries.append(summary)

    return jsonify({'explanation': explanation, 'bug_summaries': summaries})

@app.route('/bug-log', methods=['GET'])
def bug_log():
    log = read_bug_log()
    return jsonify({'log': log})

@app.route('/generate-quiz', methods=['GET'])
def generate_quiz():
    log = read_bug_log()
    quizzes = []

    if not log:
        return jsonify({'quizzes': []})

    genai.configure(api_key=GEMINI_API_KEY)

    # Combine last 15 bugs into one prompt for a 15-question quiz
    bugs = log[-15:] if len(log) >= 15 else log
    prompt = "You are an expert programming tutor. Create a coding quiz with 15 MCQs. Each question should test understanding of a different bug from this list:\n"
    for i, bug in enumerate(bugs, 1):
        prompt += f"{i}. {bug}\n"
    prompt += """
Format each question as:
Q: <question text>
A) ...
B) ...
C) ...
D) ...
Correct Answer: <A/B/C/D>
Explanation: <short explanation>

Do not include any extra text before, between, or after the questions.
"""

    quiz_generated = False
    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            resp = model.generate_content([{"text": prompt}])
            quizzes.append(resp.text.strip())
            quiz_generated = True
            break
        except Exception as e:
            last_error = str(e)
            continue
    if not quiz_generated:
        quizzes.append(f"Error generating quiz.\n{last_error}")

    return jsonify({'quizzes': quizzes})

@app.route('/convert-code', methods=['POST'])
def convert_code():
    data = request.get_json()
    code = data.get('code', '')
    from_lang = data.get('from_lang', '')
    to_lang = data.get('to_lang', '')

    allowed_langs = {
        "python": "Python",
        "java": "Java",
        "cpp": "C++",
        "c": "C"
    }

    # Validate input
    if not code or from_lang not in allowed_langs or to_lang not in allowed_langs or from_lang == to_lang:
        return jsonify({'error': 'Invalid input or languages.'}), 400

    genai.configure(api_key=GEMINI_API_KEY)
    prompt = (
        f"Convert the following {allowed_langs[from_lang]} code to {allowed_langs[to_lang]}. "
        "Only output the converted code, no explanation or extra text.\n\n"
        f"{allowed_langs[from_lang]} code:\n{code}\n\n"
        f"{allowed_langs[to_lang]} code:"
    )

    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            resp = model.generate_content([{"text": prompt}])
            converted_code = resp.text.strip() if hasattr(resp, 'text') else ""
            return jsonify({'converted_code': converted_code})
        except Exception as e:
            last_error = str(e)
            continue

    return jsonify({'error': f'Conversion failed. {last_error}'}), 500


if __name__ == "__main__":
    app.run(debug=True)