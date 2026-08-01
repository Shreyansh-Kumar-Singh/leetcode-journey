/* ==========================================================
   Dashboard v2
   Part 1
========================================================== */

'use strict';

const Dashboard = {

    profile: null,

    stats: null,

    submissions: [],

    questions: [],

    tags: [],

    languages: [],

    heatmap: [],

    charts: {}

};


/* ==========================================================
Load Everything
========================================================== */

async function loadDashboard() {

    try {

        showLoading(true);

        const [

            profile,

            stats,

            submissions,

            questions,

            tags,

            languages,

            heatmap

        ] = await Promise.all([

            GitHubData.getProfile(),

            GitHubData.getStats(),

            GitHubData.getSubmissions(),

            GitHubData.getQuestions(),

            GitHubData.getTags(),

            GitHubData.getLanguages(),

            GitHubData.getHeatmap()

        ]);

        Dashboard.profile = profile;

        Dashboard.stats = stats;

        Dashboard.submissions = submissions;

        Dashboard.questions = questions;

        Dashboard.tags = tags;

        Dashboard.languages = languages;

        Dashboard.heatmap = heatmap;

        renderProfile();

        renderStats();

        renderDifficultyCards();

        renderAchievements();

        renderSummary();

        renderTopTags();

        renderRecentSubmissions();

        renderMiniHeatmap();

        createWeeklyChart();

        createDifficultyChart();

        createLanguageChart();

        showLoading(false);

    }
    catch (e) {

        console.error(e);

        showToast("Unable to load dashboard");

    }

}


/* ==========================================================
Loading
========================================================== */

function showLoading(state) {

    const loader = document.getElementById("loading-overlay");

    if (!loader) return;

    loader.style.display = state ? "flex" : "none";

}


/* ==========================================================
Toast
========================================================== */

function showToast(text) {

    const toast = document.getElementById("toast");

    const label = document.getElementById("toast-text");

    if (!toast) return;

    label.textContent = text;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* ==========================================================
Profile
========================================================== */

function renderProfile() {

    const p = Dashboard.profile;

    if (!p) return;

    document.getElementById("profile-name").textContent =

        p.name || p.realName || "LeetCode User";

    document.getElementById("profile-username").textContent =

        "@" + (p.username || "leetcode");

    document.getElementById("sidebar-username").textContent =

        "@" + (p.username || "leetcode");

    const avatar = document.getElementById("profile-avatar");

    const initials = (p.name || "LC")

        .split(" ")

        .map(x => x[0])

        .join("")

        .substring(0, 2)

        .toUpperCase();

    avatar.textContent = initials;

    document.getElementById("last-updated-text").textContent =

        new Date().toLocaleDateString();

}


/* ==========================================================
Animated Counter
========================================================== */

function animateValue(id, end) {

    const el = document.getElementById(id);

    if (!el) return;

    let start = 0;

    const duration = 1200;

    const step = end / (duration / 16);

    function update() {

        start += step;

        if (start >= end) {

            el.textContent = end;

            return;

        }

        el.textContent = Math.floor(start);

        requestAnimationFrame(update);

    }

    update();

}
/* ==========================================================
   Dashboard v2
   Part 2
   Statistics & Summary
========================================================== */


/* ==========================================================
Statistics Cards
========================================================== */

function renderStats() {

    const stats = Dashboard.stats;

    if (!stats) return;

    animateValue(
        "total-solved",
        Number(
            stats.totalSolved ??
            stats.total ??
            stats.solved ??
            0
        )
    );

    document.getElementById("acceptance-rate").textContent =
        (stats.acceptanceRate ?? stats.acceptance ?? 0) + "%";

    animateValue(
        "current-streak",
        Number(
            stats.currentStreak ?? 0
        )
    );

    animateValue(
        "longest-streak",
        Number(
            stats.longestStreak ?? 0
        )
    );

    document.getElementById("ranking").textContent =
        stats.ranking ??
        stats.rank ??
        "--";

}


/* ==========================================================
Difficulty Cards
========================================================== */

function renderDifficultyCards() {

    const stats = Dashboard.stats;

    if (!stats) return;

    const easy =
        stats.easy ??
        stats.easySolved ??
        (stats.difficulty?.easy) ??
        0;

    const medium =
        stats.medium ??
        stats.mediumSolved ??
        (stats.difficulty?.medium) ??
        0;

    const hard =
        stats.hard ??
        stats.hardSolved ??
        (stats.difficulty?.hard) ??
        0;

    animateValue("easy-count", easy);
    animateValue("medium-count", medium);
    animateValue("hard-count", hard);

}


/* ==========================================================
Achievements
========================================================== */

function renderAchievements() {

    const stats = Dashboard.stats;

    if (!stats) return;

    document.getElementById("achievement-streak").textContent =
        (stats.currentStreak ?? 0) + " Days";

    document.getElementById("achievement-longest").textContent =
        (stats.longestStreak ?? 0) + " Days";

    document.getElementById("accepted-total").textContent =
        stats.totalSolved ??
        stats.total ??
        0;

    document.getElementById("accepted-rate").textContent =
        (stats.acceptanceRate ?? stats.acceptance ?? 0) + "%";

}


/* ==========================================================
Summary Cards
========================================================== */

function renderSummary() {

    const stats = Dashboard.stats;

    if (!stats) return;

    document.getElementById("summary-easy").textContent =
        stats.easy ??
        stats.easySolved ??
        0;

    document.getElementById("summary-medium").textContent =
        stats.medium ??
        stats.mediumSolved ??
        0;

    document.getElementById("summary-hard").textContent =
        stats.hard ??
        stats.hardSolved ??
        0;

    document.getElementById("summary-submissions").textContent =
        Dashboard.submissions.length;

}


/* ==========================================================
Top Tags
========================================================== */

function renderTopTags() {

    const container =
        document.getElementById("top-tags");

    if (!container) return;

    container.innerHTML = "";

    let tags = [...Dashboard.tags];

    if (tags.length === 0) {

        container.innerHTML =
            "<p>No Tags Available</p>";

        return;

    }

    tags.sort((a, b) =>

        (b.count || 0) - (a.count || 0)

    );

    tags.slice(0, 12).forEach(tag => {

        const div = document.createElement("div");

        div.className = "tag-chip";

        div.innerHTML = `

            <span>${tag.name}</span>

            <strong>${tag.count}</strong>

        `;

        container.appendChild(div);

    });

}
/* ==========================================================
   Dashboard v2
   Part 3
   Timeline + Heatmap + Weekly Chart
========================================================== */


/* ==========================================================
Recent Submissions
========================================================== */

function renderRecentSubmissions() {

    const container =
        document.getElementById("recent-submissions");

    if (!container) return;

    container.innerHTML = "";

    const submissions =
        Dashboard.submissions
            .slice()
            .sort((a, b) =>

                new Date(b.timestamp) - new Date(a.timestamp)

            )
            .slice(0, 10);

    if (submissions.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                No submissions found.

            </div>

        `;

        return;

    }

    submissions.forEach(item => {

        const row = document.createElement("div");

        row.className = "submission-row";

        row.innerHTML = `

        <div class="submission-left">

            <div class="submission-title">

                ${item.title}

            </div>

            <div class="submission-meta">

                ${item.language}
                •
                ${item.status}

            </div>

        </div>

        <div class="submission-right">

            ${formatDate(item.timestamp)}

        </div>

        `;

        container.appendChild(row);

    });

}



/* ==========================================================
Mini Heatmap
========================================================== */

function renderMiniHeatmap() {

    const container =
        document.getElementById("mini-heatmap");

    if (!container) return;

    container.innerHTML = "";

    const data =
        Dashboard.heatmap.slice(-84);

    data.forEach(day => {

        const cell = document.createElement("div");

        cell.className = "heatmap-cell";

        const count = day.count || 0;

        let level = 0;

        if (count >= 1) level = 1;
        if (count >= 3) level = 2;
        if (count >= 6) level = 3;
        if (count >= 10) level = 4;

        cell.dataset.level = level;

        cell.title =

            `${formatDate(day.date)}

${count} submission(s)`;

        container.appendChild(cell);

    });

}



/* ==========================================================
Weekly Activity Chart
========================================================== */

function createWeeklyChart() {

    const ctx =
        document
            .getElementById("weeklyChart");

    if (!ctx) return;

    const labels = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];

    const values = [0, 0, 0, 0, 0, 0, 0];

    Dashboard.submissions.forEach(s => {

        const d = new Date(s.timestamp);

        let day = d.getDay();

        day = (day + 6) % 7;

        values[day]++;

    });

    Dashboard.charts.weekly =

        new Chart(ctx, {

            type: "bar",

            data: {

                labels,

                datasets: [{

                    data: values,

                    borderRadius: 10,

                    backgroundColor: [
                        "#4F8CFF",
                        "#4F8CFF",
                        "#4F8CFF",
                        "#4F8CFF",
                        "#4F8CFF",
                        "#4F8CFF",
                        "#4F8CFF"
                    ]

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        grid: {

                            color: "#222"

                        }

                    },

                    x: {

                        grid: {

                            display: false

                        }

                    }

                }

            }

        });

}



/* ==========================================================
Utilities
========================================================== */

function formatDate(date) {

    return new Date(date)

        .toLocaleDateString(

            undefined,

            {

                month: "short",

                day: "numeric",

                year: "numeric"

            }

        );

}

/* ==========================================================
   Dashboard v2
   Part 4
   Charts + Theme + Export + Init
========================================================== */


/* ==========================================================
Difficulty Chart
========================================================== */

function createDifficultyChart() {

    const canvas = document.getElementById("difficultyChart");

    if (!canvas) return;

    const stats = Dashboard.stats;

    const easy =
        stats.easy ??
        stats.easySolved ??
        0;

    const medium =
        stats.medium ??
        stats.mediumSolved ??
        0;

    const hard =
        stats.hard ??
        stats.hardSolved ??
        0;

    Dashboard.charts.difficulty = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: [
                "Easy",
                "Medium",
                "Hard"
            ],

            datasets: [{

                data: [
                    easy,
                    medium,
                    hard
                ],

                backgroundColor: [

                    "#22c55e",

                    "#f59e0b",

                    "#ef4444"

                ],

                borderWidth: 0,

                hoverOffset: 12

            }]

        },

        options: {

            responsive: true,

            cutout: "72%",

            animation: {

                animateRotate: true,

                duration: 1200

            },

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        color: "#d1d5db",

                        padding: 18

                    }

                }

            }

        }

    });

}



/* ==========================================================
Language Chart
========================================================== */

function createLanguageChart() {

    const canvas = document.getElementById("languageChart");

    if (!canvas) return;

    let labels = [];

    let values = [];

    Dashboard.languages.forEach(item => {

        labels.push(item.language);

        values.push(item.count);

    });

    Dashboard.charts.language = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels,

            datasets: [{

                data: values,

                backgroundColor: [

                    "#4F8CFF",

                    "#8B5CF6",

                    "#06B6D4",

                    "#22C55E",

                    "#F97316",

                    "#E11D48",

                    "#14B8A6",

                    "#FACC15"

                ],

                borderWidth: 0,

                hoverOffset: 10

            }]

        },

        options: {

            responsive: true,

            cutout: "70%",

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        color: "#d1d5db"

                    }

                }

            }

        }

    });

}



/* ==========================================================
Export JSON
========================================================== */

document

    .querySelector("[data-export-stats]")

    ?.addEventListener("click", () => {

        const data = {

            profile: Dashboard.profile,

            stats: Dashboard.stats,

            submissions: Dashboard.submissions,

            questions: Dashboard.questions,

            tags: Dashboard.tags,

            languages: Dashboard.languages,

            heatmap: Dashboard.heatmap

        };

        const blob = new Blob(

            [

                JSON.stringify(

                    data,

                    null,

                    2

                )

            ],

            {

                type: "application/json"

            }

        );

        const a = document.createElement("a");

        a.href = URL.createObjectURL(blob);

        a.download = "leetcode-dashboard.json";

        a.click();

        URL.revokeObjectURL(a.href);

        showToast("Dashboard exported.");

    });



/* ==========================================================
Theme Toggle
========================================================== */

const toggle = document.querySelector("[data-theme-toggle]");

toggle?.addEventListener("click", () => {

    const html = document.documentElement;

    const current = html.getAttribute("data-theme");

    const next = current === "dark" ? "light" : "dark";

    html.setAttribute(

        "data-theme",

        next

    );

    localStorage.setItem(

        "theme",

        next

    );

});

(function () {

    const saved =

        localStorage.getItem("theme");

    if (saved) {

        document.documentElement.setAttribute(

            "data-theme",

            saved

        );

    }

})();



/* ==========================================================
Initialize Dashboard
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadDashboard();

    }

);

/* ==========================================================
   Dashboard v2
   Part 5 (Final)
========================================================== */


/* ==========================================================
Better Counter Animation
========================================================== */

function animateNumber(id, end, suffix = "") {

    const el = document.getElementById(id);

    if (!el) return;

    end = Number(end) || 0;

    let current = 0;

    const duration = 1200;

    const start = performance.now();

    function frame(now) {

        const progress = Math.min(
            (now - start) / duration,
            1
        );

        current = Math.floor(end * progress);

        el.textContent =
            current.toLocaleString() + suffix;

        if (progress < 1) {

            requestAnimationFrame(frame);

        }

    }

    requestAnimationFrame(frame);

}


/* ==========================================================
Refresh Numbers
========================================================== */

function refreshDashboardNumbers() {

    const s = Dashboard.stats;

    if (!s) return;

    animateNumber(

        "total-solved",

        s.totalSolved ??
        s.total ??
        0

    );

    animateNumber(

        "easy-count",

        s.easy ??
        s.easySolved ??
        0

    );

    animateNumber(

        "medium-count",

        s.medium ??
        s.mediumSolved ??
        0

    );

    animateNumber(

        "hard-count",

        s.hard ??
        s.hardSolved ??
        0

    );

}


/* ==========================================================
Skeleton Loader
========================================================== */

function showSkeleton() {

    document

        .querySelectorAll(".stat-number")

        .forEach(el => {

            el.innerHTML = `

        <div class="skeleton-line"></div>

        `;

        });

}


/* ==========================================================
Remove Skeleton
========================================================== */

function hideSkeleton() {

    document

        .querySelectorAll(".skeleton-line")

        .forEach(x => x.remove());

}


/* ==========================================================
Search Recent Submissions
========================================================== */

function filterRecentSubmissions(text) {

    const rows = document

        .querySelectorAll(".submission-row");

    text = text.toLowerCase();

    rows.forEach(row => {

        row.style.display =

            row.innerText

                .toLowerCase()

                .includes(text)

                ? "flex" : "none";

    });

}


/* ==========================================================
Auto Refresh
========================================================== */

function enableAutoRefresh() {

    setInterval(async () => {

        try {

            Dashboard.stats =

                await GitHubData.getStats();

            refreshDashboardNumbers();

        }

        catch (e) {

            console.warn(

                "Refresh skipped"

            );

        }

    }, 60000);

}


/* ==========================================================
Dashboard Error
========================================================== */

function showDashboardError(message) {

    document.querySelector(

        ".page-content"

    ).innerHTML = `

    <div class="card"

    style="

    text-align:center;

    padding:80px;

    ">

        <h2>

        ⚠ Dashboard Error

        </h2>

        <br>

        <p>

        ${message}

        </p>

    </div>

    `;

}


/* ==========================================================
Achievements
========================================================== */

function unlockAchievements() {

    const solved =

        Dashboard.stats.totalSolved ??

        0;

    if (solved >= 100) {

        showToast(

            "🏆 100 Problems Milestone"

        );

    }

    if (solved >= 250) {

        showToast(

            "🚀 250 Problems Milestone"

        );

    }

    if (solved >= 500) {

        showToast(

            "🔥 500 Problems Milestone"

        );

    }

}


/* ==========================================================
Performance
========================================================== */

function optimizeDashboard() {

    if (Dashboard.charts.weekly)

        Dashboard.charts.weekly.resize();

    if (Dashboard.charts.language)

        Dashboard.charts.language.resize();

    if (Dashboard.charts.difficulty)

        Dashboard.charts.difficulty.resize();

}


/* ==========================================================
Window Resize
========================================================== */

window.addEventListener(

    "resize",

    optimizeDashboard

);


/* ==========================================================
Initialize Extras
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        showSkeleton();

        loadDashboard()

            .then(() => {

                hideSkeleton();

                refreshDashboardNumbers();

                enableAutoRefresh();

                unlockAchievements();

            })

            .catch(err => {

                console.error(err);

                showDashboardError(

                    "Unable to load dashboard."

                );

            });

    }

);