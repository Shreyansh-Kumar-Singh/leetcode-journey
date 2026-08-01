/* ==========================================================================
   analytics.js V2
   LeetCode Journey Analytics
   ========================================================================== */

(() => {

'use strict';

/* ==========================================================================
   Global Variables
   ========================================================================== */

let charts = {};

let analytics = {
    stats: null,
    profile: null,
    streaks: null,
    questions: [],
    submissions: [],
    heatmap: [],
    tags: [],
    languages: []
};


/* ==========================================================================
   DOM Elements
   ========================================================================== */

const $ = id => document.getElementById(id);

const statsGrid = $("analytics-stats");

const sidebarUsername = $("sidebar-username");

const updatedText = $("last-updated-text");

const streakTerminal = $("term-current-streak");


/* ==========================================================================
   Loading Skeleton
   ========================================================================== */

function showLoading(){

    if(!statsGrid) return;

    statsGrid.innerHTML = Array.from({length:4})
        .map(() => `
            <div class="skeleton skel-stat"></div>
        `)
        .join("");

}


/* ==========================================================================
   Error State
   ========================================================================== */

function showError(message){

    statsGrid.innerHTML = `

        <div class="card error-state"
             style="grid-column:1/-1">

            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <circle
                    cx="12"
                    cy="12"
                    r="10"/>

                <path
                    d="M12 8v5M12 16h.01"/>

            </svg>

            <div class="title">

                Could not load analytics

            </div>

            <div>

                ${message}

            </div>

        </div>

    `;

    console.error(message);

}


/* ==========================================================================
   Theme Colors
   ========================================================================== */

function colors(){

    const css = getComputedStyle(document.documentElement);

    return{

        teal:
            css.getPropertyValue("--accent-teal").trim(),

        violet:
            css.getPropertyValue("--accent-violet").trim(),

        info:
            css.getPropertyValue("--info").trim(),

        easy:
            css.getPropertyValue("--easy").trim(),

        medium:
            css.getPropertyValue("--medium").trim(),

        hard:
            css.getPropertyValue("--hard").trim(),

        text:
            css.getPropertyValue("--text").trim()

    };

}


// /* ==========================================================================
//    Destroy Existing Charts
//    ========================================================================== */

// function destroyCharts(){

//     Object.values(charts).forEach(chart=>{

//         if(chart){

//             chart.destroy();

//         }

//     });

//     charts = {};

// }


/* ==========================================================================
   Load All Data
   ========================================================================== */

async function loadData(){

    [

        analytics.stats,

        analytics.profile,

        analytics.streaks,

        analytics.questions,

        analytics.submissions,

        analytics.heatmap,

        analytics.tags,

        analytics.languages

    ] = await Promise.all([

        GitHubData.getStats(),

        GitHubData.getProfile(),

        GitHubData.getStreaks(),

        GitHubData.getQuestions(),

        GitHubData.getSubmissions(),

        GitHubData.getHeatmap(),

        GitHubData.getTags(),

        GitHubData.getLanguages()

    ]);

}


/* ==========================================================================
   Update Sidebar
   ========================================================================== */

function updateSidebar(){

    if(sidebarUsername){

        sidebarUsername.textContent =
            "@" +
            (analytics.profile.username || "user");

    }

    if(updatedText){

        updatedText.textContent =
            App.timeAgo(
                analytics.profile.lastUpdated
            );

    }

    if(streakTerminal){

        streakTerminal.innerHTML = `

            ${analytics.streaks.current}

            day${analytics.streaks.current===1?"":"s"}

            <span class="term-cursor"></span>

        `;

    }

}


/* ==========================================================================
   Utility Functions
   ========================================================================== */

function activeDays(){

    return analytics.heatmap.filter(
        d=>d.count>0
    ).length;

}

function solvedQuestions(){

    return analytics.questions.filter(
        q=>q.status==="SOLVED"
    ).length;

}

function averagePerDay(){

    const active = activeDays();

    if(active===0) return 0;

    return analytics.stats.totalSubmissions/active;

}
/* ==========================================================================
   SVG Icons
   ========================================================================== */

function svgTrend(){

    return `
    <svg viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2">

        <path d="M3 3v18h18"/>

        <path d="M7 15l4-5 3 3 5-7"/>

    </svg>
    `;

}

function svgCalendar(){

    return `
    <svg viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2">

        <rect x="3"
              y="4"
              width="18"
              height="17"
              rx="2"/>

        <path d="M3 9h18"/>

    </svg>
    `;

}

function svgCode(){

    return `
    <svg viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2">

        <path d="M8 6l-6 6 6 6"/>

        <path d="M16 6l6 6-6 6"/>

    </svg>
    `;

}

function svgFire(){

    return `
    <svg viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2">

        <path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-2.5s2 1 2 4.5a5 5 0 0 1-10 0C7 8 12 6 12 2z"/>

    </svg>
    `;

}


/* ==========================================================================
   Animated Counter
   ========================================================================== */

function animateValue(element,end,suffix=""){

    if(!element) return;

    let start=0;

    const duration=1000;

    const step=Math.max(1,Math.floor(end/60));

    const timer=setInterval(()=>{

        start+=step;

        if(start>=end){

            start=end;

            clearInterval(timer);

        }

        element.textContent=start+suffix;

    },duration/60);

}


/* ==========================================================================
   Statistics Cards
   ========================================================================== */

function renderStatistics(){

    const c=colors();

    const active=activeDays();

    const solved=solvedQuestions();

    const avg=averagePerDay();

    statsGrid.innerHTML=`

    <div class="card stat-card fade-up">

        <div class="stat-icon info">

            ${svgTrend()}

        </div>

        <div class="stat-value" id="stat-acceptance">

            0%

        </div>

        <div class="stat-label">

            Acceptance Rate

        </div>

    </div>

    <div class="card stat-card fade-up">

        <div class="stat-icon teal">

            ${svgCalendar()}

        </div>

        <div class="stat-value" id="stat-active">

            0

        </div>

        <div class="stat-label">

            Active Days

        </div>

    </div>

    <div class="card stat-card fade-up">

        <div class="stat-icon violet">

            ${svgCode()}

        </div>

        <div class="stat-value" id="stat-average">

            0

        </div>

        <div class="stat-label">

            Avg Submissions / Day

        </div>

    </div>

    <div class="card stat-card fade-up">

        <div class="stat-icon medium">

            ${svgFire()}

        </div>

        <div class="stat-value" id="stat-streak">

            0

        </div>

        <div class="stat-label">

            Longest Streak

        </div>

    </div>

    `;

    animateValue(

        $("stat-active"),

        active

    );

    animateValue(

        $("stat-streak"),

        analytics.streaks.longest,

        " d"

    );

    animateValue(

        $("stat-average"),

        Math.round(avg)

    );

    const accept=$("stat-acceptance");

    if(accept){

        accept.textContent=

        analytics.stats.acceptanceRate.toFixed(1)+"%";

    }

}


/* ==========================================================================
   Summary Object
   ========================================================================== */

function analyticsSummary(){

    return{

        solved:

            solvedQuestions(),

        submissions:

            analytics.stats.totalSubmissions,

        acceptance:

            analytics.stats.acceptanceRate,

        activeDays:

            activeDays(),

        longest:

            analytics.streaks.longest,

        current:

            analytics.streaks.current

    };

}


/* ==========================================================================
   Fade Animation
   ========================================================================== */

function revealCards(){

    document

    .querySelectorAll(".fade-up")

    .forEach((card,index)=>{

        card.style.opacity=0;

        card.style.transform="translateY(20px)";

        setTimeout(()=>{

            card.style.transition=

            "all .5s ease";

            card.style.opacity=1;

            card.style.transform=

            "translateY(0)";

        },index*120);

    });

}

/* ==========================================================================
   Timeline Chart
   ========================================================================== */

function renderTimelineChart(){

    const canvas = $("chart-timeline");

    if(!canvas) return;

    const c = colors();

    const data = [...analytics.heatmap]
        .sort((a,b)=>new Date(a.date)-new Date(b.date));

    charts.timeline = new Chart(canvas,{

        type:"line",

        data:{

            labels:data.map(d=>d.date),

            datasets:[{

                label:"Daily Submissions",

                data:data.map(d=>d.count),

                borderColor:c.teal,

                backgroundColor:"rgba(46,230,196,.15)",

                fill:true,

                tension:.35,

                pointRadius:0,

                borderWidth:2

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            interaction:{
                intersect:false,
                mode:"index"
            },

            plugins:{
                legend:{
                    display:false
                }
            },

            scales:{

                x:{
                    grid:{
                        display:false
                    },
                    ticks:{
                        maxTicksLimit:10
                    }
                },

                y:{
                    beginAtZero:true,
                    grid:{
                        color:"rgba(255,255,255,.06)"
                    }
                }

            }

        }

    });

}



/* ==========================================================================
   Difficulty Distribution
   ========================================================================== */

function renderDifficultyChart(){

    const canvas = $("chart-difficulty");

    if(!canvas) return;

    const c = colors();

    charts.difficulty = new Chart(canvas,{

        type:"doughnut",

        data:{

            labels:[
                "Easy",
                "Medium",
                "Hard"
            ],

            datasets:[{

                data:[

                    analytics.stats.difficultyCounts?.EASY||0,

                    analytics.stats.difficultyCounts?.MEDIUM||0,

                    analytics.stats.difficultyCounts?.HARD||0

                ],

                backgroundColor:[

                    c.easy,

                    c.medium,

                    c.hard

                ],

                borderWidth:0

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            cutout:"65%",

            plugins:{

                legend:{
                    position:"bottom"
                }

            }

        }

    });

}



/* ==========================================================================
   Language Distribution
   ========================================================================== */

function renderLanguageChart(){

    const canvas = $("chart-language");

    if(!canvas) return;

    const c = colors();

    const palette=[

        c.teal,
        c.violet,
        c.info,
        c.medium,
        c.hard,
        "#4ade80",
        "#fb7185",
        "#38bdf8"

    ];

    charts.language = new Chart(canvas,{

        type:"doughnut",

        data:{

            labels:analytics.languages.map(l=>l.language),

            datasets:[{

                data:analytics.languages.map(l=>l.count),

                backgroundColor:

                    analytics.languages.map(

                        (_,i)=>palette[i%palette.length]

                    ),

                borderWidth:0

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            cutout:"60%",

            plugins:{

                legend:{
                    position:"bottom"
                }

            }

        }

    });

}



/* ==========================================================================
   Monthly Solved Trend
   ========================================================================== */

function renderMonthlyChart(){

    const canvas = $("chart-monthly");

    if(!canvas) return;

    const c = colors();

    const solved = analytics.questions.filter(

        q=>q.status==="SOLVED" && q.last_submitted_at

    );

    const months={};

    solved.forEach(q=>{

        const d=new Date(q.last_submitted_at);

        const key=

            d.getFullYear()+"-"+

            String(d.getMonth()+1).padStart(2,"0");

        months[key]=(months[key]||0)+1;

    });

    const labels=Object.keys(months).sort();

    charts.monthly = new Chart(canvas,{

        type:"bar",

        data:{

            labels,

            datasets:[{

                data:labels.map(l=>months[l]),

                backgroundColor:c.teal,

                borderRadius:8,

                maxBarThickness:36

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    display:false
                }

            },

            scales:{

                x:{
                    grid:{
                        display:false
                    }
                },

                y:{
                    beginAtZero:true,
                    ticks:{
                        stepSize:1
                    },
                    grid:{
                        color:"rgba(255,255,255,.06)"
                    }
                }

            }

        }

    });

}



/* ==========================================================================
   Render Core Charts
   ========================================================================== */

function renderCharts(){

    renderTimelineChart();

    renderDifficultyChart();

    renderLanguageChart();

    renderMonthlyChart();

}

/* ==========================================================================
   Weekly Activity Chart
   ========================================================================== */

function renderWeeklyChart(){

    const canvas = $("chart-weekly");

    if(!canvas) return;

    const c = colors();

    const labels = [
        "Mon","Tue","Wed",
        "Thu","Fri","Sat","Sun"
    ];

    const values = new Array(7).fill(0);

    analytics.submissions.forEach(sub=>{

        if(!sub.timestamp) return;

        const date = new Date(Number(sub.timestamp)*1000);

        let day = date.getDay();

        day = (day+6)%7;

        values[day]++;

    });

    charts.weekly = new Chart(canvas,{

        type:"bar",

        data:{

            labels,

            datasets:[{

                label:"Submissions",

                data:values,

                backgroundColor:c.violet,

                borderRadius:8,

                maxBarThickness:40

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    display:false
                }

            },

            scales:{

                x:{
                    grid:{
                        display:false
                    }
                },

                y:{
                    beginAtZero:true,
                    ticks:{
                        precision:0
                    },
                    grid:{
                        color:"rgba(255,255,255,.06)"
                    }
                }

            }

        }

    });

}


/* ==========================================================================
   Hourly Activity Chart
   ========================================================================== */

function renderHourlyChart(){

    const canvas = $("chart-hourly");

    if(!canvas) return;

    const c = colors();

    const hours = new Array(24).fill(0);

    analytics.submissions.forEach(sub=>{

        if(!sub.timestamp) return;

        const date = new Date(Number(sub.timestamp)*1000);

        hours[date.getHours()]++;

    });

    charts.hourly = new Chart(canvas,{

        type:"line",

        data:{

            labels:[
                "0","1","2","3","4","5",
                "6","7","8","9","10","11",
                "12","13","14","15","16","17",
                "18","19","20","21","22","23"
            ],

            datasets:[{

                data:hours,

                borderColor:c.info,

                backgroundColor:"rgba(56,189,248,.15)",

                fill:true,

                tension:.35,

                pointRadius:3,

                borderWidth:2

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    display:false
                }

            },

            scales:{

                x:{
                    grid:{
                        display:false
                    }
                },

                y:{
                    beginAtZero:true,
                    ticks:{
                        precision:0
                    },
                    grid:{
                        color:"rgba(255,255,255,.06)"
                    }
                }

            }

        }

    });

}


/* ==========================================================================
   Submission Status Chart
   ========================================================================== */

function renderSubmissionStatusChart(){

    const canvas = $("chart-status");

    if(!canvas) return;

    const c = colors();

    let accepted = 0;
    let failed = 0;

    analytics.submissions.forEach(sub=>{

        if(
            sub.status==="Accepted" ||
            sub.status_display==="Accepted"
        ){

            accepted++;

        }else{

            failed++;

        }

    });

    charts.status = new Chart(canvas,{

        type:"pie",

        data:{

            labels:[
                "Accepted",
                "Failed"
            ],

            datasets:[{

                data:[
                    accepted,
                    failed
                ],

                backgroundColor:[
                    c.easy,
                    c.hard
                ],

                borderWidth:0

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    position:"bottom"
                }

            }

        }

    });

}


/* ==========================================================================
   Difficulty Progression Chart
   ========================================================================== */

function renderProgressionChart(){

    const canvas = $("chart-progression");

    if(!canvas) return;

    const c = colors();

    const lookup = {};

    analytics.questions.forEach(q=>{

        lookup[q.title_slug] = q;

    });

    let easy = 0;
    let medium = 0;
    let hard = 0;

    const easyData = [];
    const mediumData = [];
    const hardData = [];

    analytics.submissions

        .slice()

        .sort((a,b)=>Number(a.timestamp)-Number(b.timestamp))

        .forEach(sub=>{

            const q = lookup[sub.title_slug];

            if(!q) return;

            switch(q.difficulty){

                case "EASY":
                    easy++;
                    break;

                case "MEDIUM":
                    medium++;
                    break;

                case "HARD":
                    hard++;
                    break;

            }

            easyData.push(easy);
            mediumData.push(medium);
            hardData.push(hard);

        });

    charts.progression = new Chart(canvas,{

        type:"line",

        data:{

            labels:

                easyData.map((_,i)=>i+1),

            datasets:[

                {

                    label:"Easy",

                    data:easyData,

                    borderColor:c.easy,

                    tension:.3

                },

                {

                    label:"Medium",

                    data:mediumData,

                    borderColor:c.medium,

                    tension:.3

                },

                {

                    label:"Hard",

                    data:hardData,

                    borderColor:c.hard,

                    tension:.3

                }

            ]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            interaction:{

                mode:"index",

                intersect:false

            }

        }

    });

}


/* ==========================================================================
   Render Advanced Charts
   ========================================================================== */

function renderAdvancedCharts(){

    renderWeeklyChart();

    renderHourlyChart();

    renderSubmissionStatusChart();

    renderProgressionChart();

}

/* ==========================================================================
   Analytics Insights
   ========================================================================== */

function renderInsights(){

    const container = $("analytics-insights");

    if(!container) return;

    const easy =
        analytics.stats.difficultyCounts?.EASY || 0;

    const medium =
        analytics.stats.difficultyCounts?.MEDIUM || 0;

    const hard =
        analytics.stats.difficultyCounts?.HARD || 0;

    let strongest = "Easy";

    if(medium >= easy && medium >= hard)
        strongest = "Medium";

    if(hard >= easy && hard >= medium)
        strongest = "Hard";

    const active = activeDays();

    let consistency = "Needs Improvement";

    if(active >= 300)
        consistency = "Excellent";

    else if(active >= 200)
        consistency = "Very Good";

    else if(active >= 100)
        consistency = "Good";

    container.innerHTML = `

        <div class="insight-card">

            <div class="insight-title">

                🎯 Strongest Area

            </div>

            <div class="insight-value">

                ${strongest}

            </div>

        </div>

        <div class="insight-card">

            <div class="insight-title">

                📚 Problems Solved

            </div>

            <div class="insight-value">

                ${solvedQuestions()}

            </div>

        </div>

        <div class="insight-card">

            <div class="insight-title">

                🔥 Consistency

            </div>

            <div class="insight-value">

                ${consistency}

            </div>

        </div>

    `;

}


/* ==========================================================================
   Best Coding Day
   ========================================================================== */

function renderBestDay(){

    const el = $("best-day");

    if(!el) return;

    const names = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];

    const count = new Array(7).fill(0);

    analytics.submissions.forEach(sub=>{

        if(!sub.timestamp) return;

        const d = new Date(Number(sub.timestamp)*1000);

        count[d.getDay()]++;

    });

    const best =
        count.indexOf(Math.max(...count));

    el.textContent =
        `${names[best]} (${count[best]} submissions)`;

}


/* ==========================================================================
   Best Month
   ========================================================================== */

function renderBestMonth(){

    const el = $("best-month");

    if(!el) return;

    const months = [

        "January","February","March","April",
        "May","June","July","August",
        "September","October","November","December"

    ];

    const values = new Array(12).fill(0);

    analytics.submissions.forEach(sub=>{

        if(!sub.timestamp) return;

        const d = new Date(Number(sub.timestamp)*1000);

        values[d.getMonth()]++;

    });

    const best =
        values.indexOf(Math.max(...values));

    el.textContent =
        `${months[best]} (${values[best]} submissions)`;

}


/* ==========================================================================
   Coding Consistency
   ========================================================================== */

function renderConsistency(){

    const el = $("coding-consistency");

    if(!el) return;

    const percent = (
        activeDays()/365*100
    ).toFixed(1);

    el.textContent = percent + "%";

}


/* ==========================================================================
   Streak Cards
   ========================================================================== */

function renderStreakCards(){

    const current =
        $("current-streak-card");

    const longest =
        $("longest-streak-card");

    if(current){

        current.textContent =
            analytics.streaks.current;

    }

    if(longest){

        longest.textContent =
            analytics.streaks.longest;

    }

}


/* ==========================================================================
   Recommendation Engine
   ========================================================================== */

function renderRecommendations(){

    const box = $("recommendations");

    if(!box) return;

    const tips = [];

    const easy =
        analytics.stats.difficultyCounts?.EASY || 0;

    const medium =
        analytics.stats.difficultyCounts?.MEDIUM || 0;

    const hard =
        analytics.stats.difficultyCounts?.HARD || 0;

    if(hard < 50){

        tips.push(
            "Practice more Hard problems."
        );

    }

    if(medium < easy){

        tips.push(
            "Increase Medium problem solving."
        );

    }

    if(analytics.stats.acceptanceRate < 70){

        tips.push(
            "Improve acceptance rate before increasing speed."
        );

    }

    if(activeDays() < 120){

        tips.push(
            "Maintain a daily coding streak."
        );

    }

    if(tips.length===0){

        tips.push(
            "Excellent consistency. Keep pushing!"
        );

    }

    box.innerHTML =
        tips.map(t=>`

            <div class="tip-item">

                💡 ${t}

            </div>

        `).join("");

}


/* ==========================================================================
   AI Summary
   ========================================================================== */

function renderAISummary(){

    const box = $("ai-insights");

    if(!box) return;

    let level = "Beginner";

    const solved = solvedQuestions();

    if(solved >= 100)
        level = "Intermediate";

    if(solved >= 300)
        level = "Advanced";

    if(solved >= 600)
        level = "Expert";

    box.innerHTML = `

        <div class="insight-item">

            🧠 <strong>Skill Level</strong><br>

            ${level}

        </div>

        <div class="insight-item">

            📈 Acceptance Rate<br>

            ${analytics.stats.acceptanceRate.toFixed(1)}%

        </div>

        <div class="insight-item">

            🚀 Total Submissions<br>

            ${analytics.stats.totalSubmissions}

        </div>

        <div class="insight-item">

            📚 Problems Solved<br>

            ${solved}

        </div>

    `;

}


/* ==========================================================================
   Render All Insight Widgets
   ========================================================================== */

function renderInsightWidgets(){

    renderInsights();

    renderBestDay();

    renderBestMonth();

    renderConsistency();

    renderStreakCards();

    renderRecommendations();

    renderAISummary();

}

/* ==========================================================================
   Top Tags
   ========================================================================== */

function renderTopTags(){

    const container = $("top-tags");

    if(!container) return;

    const tags = [...analytics.tags]
        .sort((a,b)=>b.count-a.count)
        .slice(0,10);

    container.innerHTML = tags.map(tag=>`

        <div class="tag-row">

            <span class="tag-name">

                ${tag.tag}

            </span>

            <span class="tag-count">

                ${tag.count}

            </span>

        </div>

    `).join("");

}


/* ==========================================================================
   Language Ranking
   ========================================================================== */

function renderLanguageRanking(){

    const container = $("language-ranking");

    if(!container) return;

    const languages = [...analytics.languages]
        .sort((a,b)=>b.count-a.count);

    container.innerHTML = languages.map((lang,index)=>`

        <div class="rank-row">

            <div class="rank-left">

                <span class="rank-index">

                    #${index+1}

                </span>

                <span>

                    ${lang.language}

                </span>

            </div>

            <span class="badge neutral">

                ${lang.count}

            </span>

        </div>

    `).join("");

}


/* ==========================================================================
   Activity Summary
   ========================================================================== */

function renderActivitySummary(){

    const total = $("summary-total");

    const acceptance = $("summary-acceptance");

    const submissions = $("summary-submissions");

    if(total){

        total.textContent =
            solvedQuestions();

    }

    if(acceptance){

        acceptance.textContent =
            analytics.stats.acceptanceRate.toFixed(1)+"%";

    }

    if(submissions){

        submissions.textContent =
            analytics.stats.totalSubmissions;

    }

}


/* ==========================================================================
   Export Analytics
   ========================================================================== */

function exportAnalytics(){

    const data = {

        generated : new Date().toISOString(),

        profile : analytics.profile,

        stats : analytics.stats,

        streaks : analytics.streaks,

        questions : analytics.questions.length,

        submissions : analytics.submissions.length,

        tags : analytics.tags,

        languages : analytics.languages

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

            type:"application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "leetcode-analytics.json";

    a.click();

    URL.revokeObjectURL(url);

}


/* ==========================================================================
   Print Analytics
   ========================================================================== */

function printAnalytics(){

    window.print();

}


/* ==========================================================================
   Refresh Analytics
   ========================================================================== */

async function refreshAnalytics(){

    destroyCharts();

    await loadData();

    updateSidebar();

    renderStatistics();

    revealCards();

    renderCharts();

    renderAdvancedCharts();

    renderInsightWidgets();

    renderTopTags();

    renderLanguageRanking();

    renderActivitySummary();

}


/* ==========================================================================
   Button Events
   ========================================================================== */

function bindEvents(){

    document

        .querySelector("[data-export-analytics]")

        ?.addEventListener(

            "click",

            exportAnalytics

        );

    document

        .querySelector("[data-refresh]")

        ?.addEventListener(

            "click",

            refreshAnalytics

        );

    document

        .querySelector("[data-print]")

        ?.addEventListener(

            "click",

            printAnalytics

        );

}
/* ==========================================================================
   Destroy All Charts
   ========================================================================== */

function destroyCharts(){

    Object.values(charts).forEach(chart=>{

        if(chart){

            chart.destroy();

        }

    });

    charts = {};

}


/* ==========================================================================
   Initialize Analytics
   ========================================================================== */

async function initializeAnalytics(){

    try{

        showLoading();

        await loadData();

        updateSidebar();

        renderStatistics();

        revealCards();

        renderCharts();

        renderAdvancedCharts();

        renderInsightWidgets();

        renderTopTags();

        renderLanguageRanking();

        renderActivitySummary();

        // hideLoading();

        App.toast(

            "Analytics Loaded",

            "success"

        );

    }

    catch(error){

        console.error(error);

        // hideLoading();

        App.toast(

            "Unable to load analytics",

            "error"

        );

        if(statsGrid){

            statsGrid.innerHTML=`

            <div class="card error-state">

                <h3>

                    Failed to Load Analytics

                </h3>

                <p>

                    ${error.message}

                </p>

            </div>

            `;

        }

    }

}


/* ==========================================================================
   Theme Change Support
   ========================================================================== */

window.addEventListener(

    "themeChanged",

    ()=>{

        refreshAnalytics();

    }

);


/* ==========================================================================
   Resize Support
   ========================================================================== */

window.addEventListener(

    "resize",

    App.debounce(()=>{

        Object.values(charts).forEach(chart=>{

            chart?.resize();

        });

    },250)

);


/* ==========================================================================
   Auto Refresh Every 5 Minutes
   ========================================================================== */

setInterval(

    ()=>{

        refreshAnalytics();

    },

    300000

);


/* ==========================================================================
   DOM Ready
   ========================================================================== */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        bindEvents();

        initializeAnalytics();

    }

);


/* ==========================================================================
   Expose Refresh Function
   ========================================================================== */

window.refreshAnalytics = refreshAnalytics;

})();