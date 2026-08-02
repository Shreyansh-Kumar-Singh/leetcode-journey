# 🧩 LeetCode Journey

[![Live Demo](https://img.shields.io/badge/demo-leetcode--journey-brightgreen.svg?style=flat&logo=github)](https://shreyansh-kumar-singh.github.io/leetcode-journey/)
[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Database](https://img.shields.io/badge/database-SQLite-003B57.svg)](https://sqlite.org/)

An automated, local-first analytics and backup pipeline for your LeetCode progress. 

**LeetCode Journey** logs into your LeetCode account, fetches your solved problems, complete submission history, and accepted source code, stores everything locally in a structured SQLite database, exports structured JSON files, and automatically commits and pushes the updates to your GitHub repository.

---

## 🌟 Key Features

- 🔄 **Incremental Sync**: Pulls fresh question metadata, submission logs, and source code efficiently.
- 💾 **Local-First Storage**: Keeps a full copy of your journey in a portable SQLite database (`output/leetcode.db`).
- 📄 **JSON Exporting**: Generates clean, structured JSON files ready for personal dashboards, portfolio integration, or data analysis.
- 🚀 **Automated GitHub Backups**: Automatically commits and pushes changes to keep your repository up-to-date.
- 🛠️ **Modular CLI**: Run the end-to-end pipeline or trigger specific stages (questions, submissions, code sync) independently.

---

## 🏗️ Architecture & Workflow

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   LeetCode API  │ ────> │  SQLite DB      │ ────> │  JSON Exporter  │
│  (Auth Sync)    │       │  (leetcode.db)  │       │  (output/data/) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
│
▼
┌─────────────────┐
│   GitHub Remote │
│  (Auto Commit)  │
└─────────────────┘


### Pipeline Stages

1. **Sync (`Exporter`)**:
   - `QuestionSync`: Downloads question metadata (difficulty, tags, titles).
   - `SubmissionSync`: Fetches submission history and metadata.
   - `CodeSync`: Pulls source code for accepted submissions.
2. **Export (`JSONExporter`)**: Re-populates `output/data/*.json` from the SQLite database.
3. **Push (`GitHubPush`)**: Executes `git add`, `git commit`, and `git push` to keep your remote repo in sync.

---

## 📂 Project Structure

```text
.
├── output/                     # Generated DB & exported JSON data
│   ├── leetcode.db             # Local SQLite database
│   └── data/*.json             # Exported JSON datasets
├── exporters/
│   └── json_exporter.py        # Exports database content to JSON format
├── update.py                   # Master entry point (Sync ➔ Export ➔ Push)
├── exporter.py                 # Pipeline orchestrator / CLI
├── sync_questions.py           # Syncs question details
├── sync_submission.py          # Syncs user submissions
├── sync_code.py                # Syncs submission source code
├── database.py                 # Database initialization and ORM/layer
├── queries.py                  # Core SQL queries
├── config.py                   # Environment configuration loader
├── github_push.py              # Automated Git integration
└── .env.example                # Configuration template
🚀 Getting Started
Prerequisites
Python: 3.9 or higher

Git: Configured with remote access (SSH key or credential manager recommended for automated pushes)

Installation
Clone the repository:

Bash
git clone [https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git](https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git)
cd leetcode-journey
Install dependencies:

Bash
pip install -r requirements.txt
Configuration
Copy the template environment file:

Bash
cp .env.example .env
Retrieve your LeetCode session credentials:

Log into LeetCode.

Open Developer Tools (F12 or Right-click ➔ Inspect).

Go to Application ➔ Storage ➔ Cookies ➔ https://leetcode.com.

Copy the values for LEETCODE_SESSION and csrftoken.

Fill out .env:

Code snippet
LEETCODE_SESSION=your_leetcode_session_cookie
CSRFTOKEN=your_csrftoken_cookie
LEETCODE_USERNAME=your_username
DATABASE_PATH=output/leetcode.db
PAGE_SIZE=50
REQUEST_TIMEOUT=30
RETRY_COUNT=3
💻 Usage
Full Automated Pipeline
To perform a full sync, generate JSON outputs, and push directly to GitHub:

Bash
python update.py
Granular CLI Commands
You can run individual tasks using exporter.py:

Bash
# Full database sync (questions + submissions + code)
python exporter.py sync

# Sync individual stages
python exporter.py questions     # Sync question metadata only
python exporter.py submissions   # Sync submission logs only
python exporter.py code          # Sync submitted code only
Generate JSON Exports Only
If you want to re-export JSON data without hitting LeetCode's API:

Bash
python -c "from exporters.json_exporter import JSONExporter; JSONExporter().export()"
⏰ Automation & Cron
Because update.py runs headlessly, you can easily schedule it.

Example Cron Job (Daily at 9:00 AM)
Bash
0 9 * * * cd /path/to/leetcode-journey && /usr/bin/python3 update.py >> update.log 2>&1
(Optional) You can also configure this repository with GitHub Actions using encrypted repository secrets (LEETCODE_SESSION, CSRFTOKEN).

🛡️ Security & Notes
Keep .env Private: Never commit your .env file. It contains authentication cookies and is already added to .gitignore.

Cookie Expiry: LeetCode session cookies expire periodically. If you encounter HTTP 401/403 authentication errors during syncs, refresh your LEETCODE_SESSION and CSRFTOKEN values in .env.

📄 License
This project is open-source and available under the MIT License.

give full downloadable format file for this

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   LeetCode API  │ ────> │  SQLite DB      │ ────> │  JSON Exporter  │
│  (Auth Sync)    │       │  (leetcode.db)  │       │  (output/data/) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
│
▼
┌─────────────────┐
│   GitHub Remote │
│  (Auto Commit)  │
└─────────────────┘


### Pipeline Stages

1. **Sync (`Exporter`)**:
   - `QuestionSync`: Downloads question metadata (difficulty, tags, titles).
   - `SubmissionSync`: Fetches submission history and metadata.
   - `CodeSync`: Pulls source code for accepted submissions.
2. **Export (`JSONExporter`)**: Re-populates `output/data/*.json` from the SQLite database.
3. **Push (`GitHubPush`)**: Executes `git add`, `git commit`, and `git push` to keep your remote repo in sync.

---

## 📂 Project Structure

```text
.
├── output/                     # Generated DB & exported JSON data
│   ├── leetcode.db             # Local SQLite database
│   └── data/*.json             # Exported JSON datasets
├── exporters/
│   └── json_exporter.py        # Exports database content to JSON format
├── update.py                   # Master entry point (Sync ➔ Export ➔ Push)
├── exporter.py                 # Pipeline orchestrator / CLI
├── sync_questions.py           # Syncs question details
├── sync_submission.py          # Syncs user submissions
├── sync_code.py                # Syncs submission source code
├── database.py                 # Database initialization and ORM/layer
├── queries.py                  # Core SQL queries
├── config.py                   # Environment configuration loader
├── github_push.py              # Automated Git integration
└── .env.example                # Configuration template
🚀 Getting Started
Prerequisites
Python: 3.9 or higher

Git: Configured with remote access (SSH key or credential manager recommended for automated pushes)

Installation
Clone the repository:

Bash
git clone [https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git](https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git)
cd leetcode-journey
Install dependencies:

Bash
pip install -r requirements.txt
Configuration
Copy the template environment file:

Bash
cp .env.example .env
Retrieve your LeetCode session credentials:

Log into LeetCode.

Open Developer Tools (F12 or Right-click ➔ Inspect).

Go to Application ➔ Storage ➔ Cookies ➔ https://leetcode.com.

Copy the values for LEETCODE_SESSION and csrftoken.

Fill out .env:

Code snippet
LEETCODE_SESSION=your_leetcode_session_cookie
CSRFTOKEN=your_csrftoken_cookie
LEETCODE_USERNAME=your_username
DATABASE_PATH=output/leetcode.db
PAGE_SIZE=50
REQUEST_TIMEOUT=30
RETRY_COUNT=3
💻 Usage
Full Automated Pipeline
To perform a full sync, generate JSON outputs, and push directly to GitHub:

Bash
python update.py
Granular CLI Commands
You can run individual tasks using exporter.py:

Bash
# Full database sync (questions + submissions + code)
python exporter.py sync

# Sync individual stages
python exporter.py questions     # Sync question metadata only
python exporter.py submissions   # Sync submission logs only
python exporter.py code          # Sync submitted code only
Generate JSON Exports Only
If you want to re-export JSON data without hitting LeetCode's API:

Bash
python -c "from exporters.json_exporter import JSONExporter; JSONExporter().export()"
⏰ Automation & Cron
Because update.py runs headlessly, you can easily schedule it.

Example Cron Job (Daily at 9:00 AM)
Bash
0 9 * * * cd /path/to/leetcode-journey && /usr/bin/python3 update.py >> update.log 2>&1
(Optional) You can also configure this repository with GitHub Actions using encrypted repository secrets (LEETCODE_SESSION, CSRFTOKEN).

🛡️ Security & Notes
Keep .env Private: Never commit your .env file. It contains authentication cookies and is already added to .gitignore.

Cookie Expiry: LeetCode session cookies expire periodically. If you encounter HTTP 401/403 authentication errors during syncs, refresh your LEETCODE_SESSION and CSRFTOKEN values in .env.

📄 License
This project is open-source and available under the MIT License.
"""

Save as markdown file directly
with open("README.md", "w", encoding="utf-8") as f:
f.write(readme_content)

print("Created README.md")


```text?code_stdout&code_event_index=1
Created README.md

Your Markdown file is ready
MD icon
README
 MD 
Open

You can download README.md above and replace the existing README file directly in your repository.

https://shreyansh-kumar-singh.github.io/leetcode-journey/ i have hosted the website on this address add that also in the readme file

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   LeetCode API  │ ────> │  SQLite DB      │ ────> │  JSON Exporter  │
│  (Auth Sync)    │       │  (leetcode.db)  │       │  (output/data/) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
│
▼
┌─────────────────┐
│  GitHub Remote  │
│ & GitHub Pages  │
└─────────────────┘


### Pipeline Stages

1. **Sync (`Exporter`)**:
   - `QuestionSync`: Downloads question metadata (difficulty, tags, titles).
   - `SubmissionSync`: Fetches submission history and metadata.
   - `CodeSync`: Pulls source code for accepted submissions.
2. **Export (`JSONExporter`)**: Re-populates `output/data/*.json` from the SQLite database.
3. **Push (`GitHubPush`)**: Executes `git add`, `git commit`, and `git push` to keep your remote repo and live site in sync.

---

## 📂 Project Structure

```text
.
├── output/                     # Generated DB & exported JSON data
│   ├── leetcode.db             # Local SQLite database
│   └── data/*.json             # Exported JSON datasets
├── exporters/
│   └── json_exporter.py        # Exports database content to JSON format
├── update.py                   # Master entry point (Sync ➔ Export ➔ Push)
├── exporter.py                 # Pipeline orchestrator / CLI
├── sync_questions.py           # Syncs question details
├── sync_submission.py          # Syncs user submissions
├── sync_code.py                # Syncs submission source code
├── database.py                 # Database initialization and ORM/layer
├── queries.py                  # Core SQL queries
├── config.py                   # Environment configuration loader
├── github_push.py              # Automated Git integration
└── .env.example                # Configuration template
🚀 Getting Started
Prerequisites
Python: 3.9 or higher

Git: Configured with remote access (SSH key or credential manager recommended for automated pushes)

Installation
Clone the repository:

Bash
git clone [https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git](https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git)
cd leetcode-journey
Install dependencies:

Bash
pip install -r requirements.txt
Configuration
Copy the template environment file:

Bash
cp .env.example .env
Retrieve your LeetCode session credentials:

Log into LeetCode.

Open Developer Tools (F12 or Right-click ➔ Inspect).

Go to Application ➔ Storage ➔ Cookies ➔ https://leetcode.com.

Copy the values for LEETCODE_SESSION and csrftoken.

Fill out .env:

Code snippet
LEETCODE_SESSION=your_leetcode_session_cookie
CSRFTOKEN=your_csrftoken_cookie
LEETCODE_USERNAME=your_username
DATABASE_PATH=output/leetcode.db
PAGE_SIZE=50
REQUEST_TIMEOUT=30
RETRY_COUNT=3
💻 Usage
Full Automated Pipeline
To perform a full sync, generate JSON outputs, and push directly to GitHub:

Bash
python update.py
Granular CLI Commands
You can run individual tasks using exporter.py:

Bash
# Full database sync (questions + submissions + code)
python exporter.py sync

# Sync individual stages
python exporter.py questions     # Sync question metadata only
python exporter.py submissions   # Sync submission logs only
python exporter.py code          # Sync submitted code only
Generate JSON Exports Only
If you want to re-export JSON data without hitting LeetCode's API:

Bash
python -c "from exporters.json_exporter import JSONExporter; JSONExporter().export()"
⏰ Automation & Cron
Because update.py runs headlessly, you can easily schedule it.

Example Cron Job (Daily at 9:00 AM)
Bash
0 9 * * * cd /path/to/leetcode-journey && /usr/bin/python3 update.py >> update.log 2>&1
(Optional) You can also configure this repository with GitHub Actions using encrypted repository secrets (LEETCODE_SESSION, CSRFTOKEN).

🛡️ Security & Notes
Keep .env Private: Never commit your .env file. It contains authentication cookies and is already added to .gitignore.

Cookie Expiry: LeetCode session cookies expire periodically. If you encounter HTTP 401/403 authentication errors during syncs, refresh your LEETCODE_SESSION and CSRFTOKEN values in .env.

📄 License
This project is open-source and available under the MIT License.
"""

with open("README.md", "w", encoding="utf-8") as f:
f.write(readme_content_with_website)

print("Updated README.md with website URL")


```text?code_stdout&code_event_index=1
Updated README.md with website URL

I have added the hosted website link (https://shreyansh-kumar-singh.github.io/leetcode-journey/) to both the header badges and the key features section of the README.md.

Here is the updated file for download:
[file-tag: code-generated-file-6ace792f-adaf-4200-a05e-7ce2fe928eb2]

Markdown
# 🧩 LeetCode Journey

[![Live Demo](https://img.shields.io/badge/demo-leetcode--journey-brightgreen.svg?style=flat&logo=github)](https://shreyansh-kumar-singh.github.io/leetcode-journey/)
[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Database](https://img.shields.io/badge/database-SQLite-003B57.svg)](https://sqlite.org/)

An automated, local-first analytics and backup pipeline for your LeetCode progress. 

🔗 **Live Website**: [https://shreyansh-kumar-singh.github.io/leetcode-journey/](https://shreyansh-kumar-singh.github.io/leetcode-journey/)

**LeetCode Journey** logs into your LeetCode account, fetches your solved problems, complete submission history, and accepted source code, stores everything locally in a structured SQLite database, exports structured JSON files, and automatically commits and pushes the updates to your GitHub repository.

---

## 🌟 Key Features

- 🌐 **Live Analytics Dashboard**: View your progress hosted live on GitHub Pages.
- 🔄 **Incremental Sync**: Pulls fresh question metadata, submission logs, and source code efficiently.
- 💾 **Local-First Storage**: Keeps a full copy of your journey in a portable SQLite database (`output/leetcode.db`).
- 📄 **JSON Exporting**: Generates clean, structured JSON files ready for personal dashboards, portfolio integration, or data analysis.
- 🚀 **Automated GitHub Backups**: Automatically commits and pushes changes to keep your repository up-to-date.
- 🛠️ **Modular CLI**: Run the end-to-end pipeline or trigger specific stages (questions, submissions, code sync) independently.

---

## 🏗️ Architecture & Workflow

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   LeetCode API  │ ────> │  SQLite DB      │ ────> │  JSON Exporter  │
│  (Auth Sync)    │       │  (leetcode.db)  │       │  (output/data/) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
│
▼
┌─────────────────┐
│  GitHub Remote  │
│ & GitHub Pages  │
└─────────────────┘


### Pipeline Stages

1. **Sync (`Exporter`)**:
   - `QuestionSync`: Downloads question metadata (difficulty, tags, titles).
   - `SubmissionSync`: Fetches submission history and metadata.
   - `CodeSync`: Pulls source code for accepted submissions.
2. **Export (`JSONExporter`)**: Re-populates `output/data/*.json` from the SQLite database.
3. **Push (`GitHubPush`)**: Executes `git add`, `git commit`, and `git push` to keep your remote repo and live site in sync.

---

## 📂 Project Structure

```text
.
├── output/                     # Generated DB & exported JSON data
│   ├── leetcode.db             # Local SQLite database
│   └── data/*.json             # Exported JSON datasets
├── exporters/
│   └── json_exporter.py        # Exports database content to JSON format
├── update.py                   # Master entry point (Sync ➔ Export ➔ Push)
├── exporter.py                 # Pipeline orchestrator / CLI
├── sync_questions.py           # Syncs question details
├── sync_submission.py          # Syncs user submissions
├── sync_code.py                # Syncs submission source code
├── database.py                 # Database initialization and ORM/layer
├── queries.py                  # Core SQL queries
├── config.py                   # Environment configuration loader
├── github_push.py              # Automated Git integration
└── .env.example                # Configuration template
🚀 Getting Started
Prerequisites
Python: 3.9 or higher

Git: Configured with remote access (SSH key or credential manager recommended for automated pushes)

Installation
Clone the repository:

Bash
git clone [https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git](https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git)
cd leetcode-journey
Install dependencies:

Bash
pip install -r requirements.txt
Configuration
Copy the template environment file:

Bash
cp .env.example .env
Retrieve your LeetCode session credentials:

Log into LeetCode.

Open Developer Tools (F12 or Right-click ➔ Inspect).

Go to Application ➔ Storage ➔ Cookies ➔ https://leetcode.com.

Copy the values for LEETCODE_SESSION and csrftoken.

Fill out .env:

Code snippet
LEETCODE_SESSION=your_leetcode_session_cookie
CSRFTOKEN=your_csrftoken_cookie
LEETCODE_USERNAME=your_username
DATABASE_PATH=output/leetcode.db
PAGE_SIZE=50
REQUEST_TIMEOUT=30
RETRY_COUNT=3
💻 Usage
Full Automated Pipeline
To perform a full sync, generate JSON outputs, and push directly to GitHub:

Bash
python update.py
Granular CLI Commands
You can run individual tasks using exporter.py:

Bash
# Full database sync (questions + submissions + code)
python exporter.py sync

# Sync individual stages
python exporter.py questions     # Sync question metadata only
python exporter.py submissions   # Sync submission logs only
python exporter.py code          # Sync submitted code only
Generate JSON Exports Only
If you want to re-export JSON data without hitting LeetCode's API:

Bash
python -c "from exporters.json_exporter import JSONExporter; JSONExporter().export()"
⏰ Automation & Cron
Because update.py runs headlessly, you can easily schedule it.

Example Cron Job (Daily at 9:00 AM)
Bash
0 9 * * * cd /path/to/leetcode-journey && /usr/bin/python3 update.py >> update.log 2>&1
(Optional) You can also configure this repository with GitHub Actions using encrypted repository secrets (LEETCODE_SESSION, CSRFTOKEN).

🛡️ Security & Notes
Keep .env Private: Never commit your .env file. It contains authentication cookies and is already added to .gitignore.

Cookie Expiry: LeetCode session cookies expire periodically. If you encounter HTTP 401/403 authentication errors during syncs, refresh your LEETCODE_SESSION and CSRFTOKEN values in .env.

📄 License
This project is open-source and available under the MIT License.




Gemini is AI and can make mistakes.

# 🧩 LeetCode Journey

[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Database](https://img.shields.io/badge/database-SQLite-003B57.svg)](https://sqlite.org/)

An automated, local-first analytics and backup pipeline for your LeetCode progress. 

**LeetCode Journey** logs into your LeetCode account, fetches your solved problems, complete submission history, and accepted source code, stores everything locally in a structured SQLite database, exports structured JSON files, and automatically commits and pushes the updates to your GitHub repository.

---

## 🌟 Key Features

- 🔄 **Incremental Sync**: Pulls fresh question metadata, submission logs, and source code efficiently.
- 💾 **Local-First Storage**: Keeps a full copy of your journey in a portable SQLite database (`output/leetcode.db`).
- 📄 **JSON Exporting**: Generates clean, structured JSON files ready for personal dashboards, portfolio integration, or data analysis.
- 🚀 **Automated GitHub Backups**: Automatically commits and pushes changes to keep your repository up-to-date.
- 🛠️ **Modular CLI**: Run the end-to-end pipeline or trigger specific stages (questions, submissions, code sync) independently.

---

## 🏗️ Architecture & Workflow

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   LeetCode API  │ ────> │  SQLite DB      │ ────> │  JSON Exporter  │
│  (Auth Sync)    │       │  (leetcode.db)  │       │  (output/data/) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │   GitHub Remote │
                                                    │  (Auto Commit)  │
                                                    └─────────────────┘
```

### Pipeline Stages

1. **Sync (`Exporter`)**:
   - `QuestionSync`: Downloads question metadata (difficulty, tags, titles).
   - `SubmissionSync`: Fetches submission history and metadata.
   - `CodeSync`: Pulls source code for accepted submissions.
2. **Export (`JSONExporter`)**: Re-populates `output/data/*.json` from the SQLite database.
3. **Push (`GitHubPush`)**: Executes `git add`, `git commit`, and `git push` to keep your remote repo in sync.

---

## 📂 Project Structure

```text
.
├── output/                     # Generated DB & exported JSON data
│   ├── leetcode.db             # Local SQLite database
│   └── data/*.json             # Exported JSON datasets
├── exporters/
│   └── json_exporter.py        # Exports database content to JSON format
├── update.py                   # Master entry point (Sync ➔ Export ➔ Push)
├── exporter.py                 # Pipeline orchestrator / CLI
├── sync_questions.py           # Syncs question details
├── sync_submission.py          # Syncs user submissions
├── sync_code.py                # Syncs submission source code
├── database.py                 # Database initialization and ORM/layer
├── queries.py                  # Core SQL queries
├── config.py                   # Environment configuration loader
├── github_push.py              # Automated Git integration
└── .env.example                # Configuration template
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.9 or higher
- **Git**: Configured with remote access (SSH key or credential manager recommended for automated pushes)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shreyansh-Kumar-Singh/leetcode-journey.git
   cd leetcode-journey
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Configuration

1. Copy the template environment file:
   ```bash
   cp .env.example .env
   ```

2. Retrieve your LeetCode session credentials:
   - Log into [LeetCode](https://leetcode.com).
   - Open Developer Tools (`F12` or Right-click ➔ **Inspect**).
   - Go to **Application** ➔ **Storage** ➔ **Cookies** ➔ `https://leetcode.com`.
   - Copy the values for `LEETCODE_SESSION` and `csrftoken`.

3. Fill out `.env`:
   ```env
   LEETCODE_SESSION=your_leetcode_session_cookie
   CSRFTOKEN=your_csrftoken_cookie
   LEETCODE_USERNAME=your_username
   DATABASE_PATH=output/leetcode.db
   PAGE_SIZE=50
   REQUEST_TIMEOUT=30
   RETRY_COUNT=3
   ```

---

## 💻 Usage

### Full Automated Pipeline

To perform a full sync, generate JSON outputs, and push directly to GitHub:

```bash
python update.py
```

### Granular CLI Commands

You can run individual tasks using `exporter.py`:

```bash
# Full database sync (questions + submissions + code)
python exporter.py sync

# Sync individual stages
python exporter.py questions     # Sync question metadata only
python exporter.py submissions   # Sync submission logs only
python exporter.py code          # Sync submitted code only
```

### Generate JSON Exports Only

If you want to re-export JSON data without hitting LeetCode's API:

```bash
python -c "from exporters.json_exporter import JSONExporter; JSONExporter().export()"
```

---

## ⏰ Automation & Cron

Because `update.py` runs headlessly, you can easily schedule it.

### Example Cron Job (Daily at 9:00 AM)

```bash
0 9 * * * cd /path/to/leetcode-journey && /usr/bin/python3 update.py >> update.log 2>&1
```

*(Optional)* You can also configure this repository with **GitHub Actions** using encrypted repository secrets (`LEETCODE_SESSION`, `CSRFTOKEN`).

---

## 🛡️ Security & Notes

- **Keep `.env` Private**: Never commit your `.env` file. It contains authentication cookies and is already added to `.gitignore`.
- **Cookie Expiry**: LeetCode session cookies expire periodically. If you encounter HTTP 401/403 authentication errors during syncs, refresh your `LEETCODE_SESSION` and `CSRFTOKEN` values in `.env`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
README.md
Displaying README.md.
