<!--This is not a text file so use a proper app to view it -->
# AI Code Debugger, Explainer, Quizzer & Converter by CodeSage
## Overview
This is a Flask + Gemini (Google Generative AI) application that:
1) Analyzes your code and lists mistakes (syntax, logic, redundancy), with explanations.
2) Stores short labels of detected issues into bug_log.csv.
3) Generates a 15-question quiz from your recent issues and shows correct answers.
4) Converts code between Python, C, C++, and Java.

(*Includes a login prompt UI for demo only — no backend connected.*)

<br>

## Screenshots:  
### Home Page with a python code as example 
![Home_Page](/assets/Screenshot_1.png)  
<br>
### Quiz Page (Loading State)
![Quiz_Loading_Page](/assets/Screenshot_2.png)  
<br>
### Quiz Page 
![Quiz_Page](/assets/Screenshot_3.png)  
<br>
### Converter Page (Loading State)
![Converter_Loading_Page](/assets/Screenshot_4.png)  
<br>
### Converter Page
![Converter_Page](/assets/Screenshot_5.png)  

<br>

## Project Structure

```
ai-debugger/
├── app.py                 - Flask backend (Gemini integration)
├── bug_log.csv            - CSV log of short issue labels (auto-updated)
├── index.html             - Chat-style code analysis view
├── index-script.js        - Chat page logic
├── quiz.html              - Quiz page
├── quiz-script.js         - Quiz logic
├── conversion.html        - Code converter page
└── con-script.js          - Converter logic
```

<br>

## Prerequisites

* Python 3.9+ recommended
* A Google AI Studio API key for Gemini

### 1) Set your API key

The backend reads an environment variable named GEMINI_API_KEY. (if you have set it up if not just follow option A)
Alternatively, app.py has a fallback "Your_API_Key" (change it if you prefer hardcoding although env vars are safer).

<br>

#### Option A —    
Edit app.py (Recommended for development purpose):  
* In app.py,   

* ***FIND:***

  > *GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "Your_API_Key")*  

* ***Replace--***

  > *"Your_API_Key" with your actual key generated from Google Ai studio.*

<br>

#### Option B —  
Environment variable (recommended for deployment, not recommended for development stage):  

* Windows (PowerShell):  
  * setx GEMINI_API_KEY "YOUR_KEY_HERE"  
  * Close and reopen your terminal after setx; or for current session:  
  * $env:GEMINI_API_KEY="YOUR_KEY_HERE"  

* macOS/Linux (bash/zsh):  
  * export GEMINI_API_KEY="YOUR_KEY_HERE"  

<br>

### 2) Install dependencies
First, ensure you are in the project directory that contains "requirements.txt" (In terminal).

Then run:  
> pip install -r requirements.txt

<br>

### 3) Run the backend server  

From the folder that has app.py, run: (in Terminal)
> python app.py

By default this starts Flask on http://127.0.0.1:5000 (development server).

<br>

### 4) Open the frontend  
- Open the HTML files directly (double-click).  
Note: It is recommended that you keep all files in same folder 

<br>
<br>

## Usage Notes

- The login prompt is only a placeholder UI. It has no backend functionality since the project is not deployed.
- The chat page sends your code to /explain-code and lists bullet-pointed issues.
It also logs short "bug summaries" to bug_log.csv for quiz creation.
- The quiz page reads the latest 15 summaries from bug_log.csv and requests a quiz from the backend.
- The converter page calls /convert-code; supports Python, C, C++, and Java.
- If you ever delete bug_log.csv, it will be re-created automatically once you analyze new code.

<br>

## Environment / Paths

- The backend writes to "bug_log.csv" in the working directory. Make sure the process has write permissions.
- If deploying to stateless platforms, consider storing logs in a database or mounted volume.

<br>

## Endpoints (for reference)

* POST /explain-code  
  > json: {"code": "<your code>"}  
resp: {"explanation": "...", "bug_summaries": ["...", "..."]}

* GET /bug-log  
  > resp: {"log": ["...", "..."]}

* GET /generate-quiz  
  >resp: {"quizzes": [ { "question": "Q1 ...", "options": ["A","B","C","D"], "answer": "A" }, ... ] }

* POST /convert-code  
  > json: {"code": "...", "from_lang": "python|c|cpp|java", "to_lang": "python|c|cpp|java"}
resp: {"converted_code": "..."}

<br>

## Troubleshooting

- 401/403 errors: check GEMINI_API_KEY and billing/quotas in Google AI Studio.
- CORS errors: ensure Flask is running and you used a local static server (http://localhost:5500).
- Empty quiz: analyze some code first so bug_log.csv has entries.

<br>

## License

BSD 3-Clause (see LICENSE file).

<br>

## Credits

Built by TEAM CodeSage. See Contributors for full credits.
