/* ==========================================================================
   github.js V2
   LeetCode Journey
   Data Access Layer
   ========================================================================== */

const GitHubData = (() => {

    'use strict';

    /* ==========================================================================
       Configuration
       ========================================================================== */

    const CONFIG = {

        DATA_PATH: "data/",

        CACHE_VERSION: "v2",

        CACHE_DURATION: 1000 * 60 * 10,

        REQUEST_TIMEOUT: 15000,

        ENABLE_LOCAL_CACHE: true,

        DEBUG: false

    };


    /* ==========================================================================
       Cache
       ========================================================================== */

    const memoryCache = {};

    const loadingPromises = {};


    /* ==========================================================================
       Data Store
       ========================================================================== */

    const store = {

        profile: null,

        stats: null,

        questions: null,

        submissions: null,

        heatmap: null,

        tags: null,

        languages: null,

        companies: null,

        contests: null,

        badges: null

    };


    /* ==========================================================================
       Logger
       ========================================================================== */

    function log(...args) {

        if (CONFIG.DEBUG) {

            console.log(

                "[GitHubData]",

                ...args

            );

        }

    }


    /* ==========================================================================
       Local Storage
       ========================================================================== */

    function cacheKey(file) {

        return `leetcode-${CONFIG.CACHE_VERSION}-${file}`;

    }

    function saveLocal(file, data) {

        if (!CONFIG.ENABLE_LOCAL_CACHE)

            return;

        try {

            localStorage.setItem(

                cacheKey(file),

                JSON.stringify({

                    timestamp: Date.now(),

                    data

                })

            );

        }

        catch (error) {

            console.warn(error);

        }

    }

    function readLocal(file) {

        if (!CONFIG.ENABLE_LOCAL_CACHE)

            return null;

        try {

            const raw =

                localStorage.getItem(

                    cacheKey(file)

                );

            if (!raw)

                return null;

            const obj = JSON.parse(raw);

            if (

                Date.now() - obj.timestamp >

                CONFIG.CACHE_DURATION

            ) {

                localStorage.removeItem(

                    cacheKey(file)

                );

                return null;

            }

            return obj.data;

        }

        catch (error) {

            return null;

        }

    }


    /* ==========================================================================
       Fetch With Timeout
       ========================================================================== */

    async function fetchWithTimeout(url) {

        const controller =

            new AbortController();

        const timer =

            setTimeout(

                () => controller.abort(),

                CONFIG.REQUEST_TIMEOUT

            );

        try {

            const response =

                await fetch(

                    url,

                    {

                        cache: "no-store",

                        signal: controller.signal

                    }

                );

            clearTimeout(timer);

            return response;

        }

        catch (error) {

            clearTimeout(timer);

            throw error;

        }

    }


    /* ==========================================================================
       JSON Loader
       ========================================================================== */

    async function fetchJSON(file) {

        if (memoryCache[file]) {

            return memoryCache[file];

        }

        if (loadingPromises[file]) {

            return loadingPromises[file];

        }

        const cached =

            readLocal(file);

        if (cached) {

            memoryCache[file] = cached;

            return cached;

        }

        loadingPromises[file] = (async () => {

            const url =

                CONFIG.DATA_PATH +

                file +

                "?v=" + Date.now();

            log("Loading", url);

            const response =

                await fetchWithTimeout(url);

            if (!response.ok) {

                throw new Error(

                    `Unable to load ${file}`

                );

            }

            const json =

                await response.json();

            memoryCache[file] = json;

            saveLocal(file, json);

            delete loadingPromises[file];

            return json;

        })();

        return loadingPromises[file];

    }


    /* ==========================================================================
       Validation
       ========================================================================== */

    function validateArray(data, name) {

        if (!Array.isArray(data)) {

            throw new Error(

                `${name} must be an array`

            );

        }

        return data;

    }

    function validateObject(data, name) {

        if (

            !data ||

            typeof data !== "object" ||

            Array.isArray(data)

        ) {

            throw new Error(

                `${name} must be an object`

            );

        }

        return data;

    }
    /* ==========================================================================
       Load Individual Files
       ========================================================================== */

    async function getProfile() {

        if (store.profile)
            return store.profile;

        store.profile = validateObject(

            await fetchJSON("profile.json"),

            "profile.json"

        );

        return store.profile;

    }


    async function getStats() {

        if (store.stats)
            return store.stats;

        store.stats = validateObject(

            await fetchJSON("stats.json"),

            "stats.json"

        );

        return store.stats;

    }


    async function getQuestions() {

        if (store.questions)
            return store.questions;

        store.questions = validateArray(

            await fetchJSON("questions.json"),

            "questions.json"

        );

        return store.questions;

    }


    async function getSubmissions() {

        if (store.submissions)
            return store.submissions;

        store.submissions = validateArray(

            await fetchJSON("submissions.json"),

            "submissions.json"

        );

        return store.submissions;

    }


    async function getHeatmap() {

        if (store.heatmap)
            return store.heatmap;

        store.heatmap = validateArray(

            await fetchJSON("heatmap.json"),

            "heatmap.json"

        );

        return store.heatmap;

    }


    async function getTags() {

        if (store.tags)
            return store.tags;

        store.tags = validateArray(

            await fetchJSON("tags.json"),

            "tags.json"

        );

        return store.tags;

    }


    async function getLanguages() {

        if (store.languages)
            return store.languages;

        store.languages = validateArray(

            await fetchJSON("languages.json"),

            "languages.json"

        );

        return store.languages;

    }


    async function getCompanies() {

        try {

            if (store.companies)
                return store.companies;

            store.companies = validateArray(

                await fetchJSON("companies.json"),

                "companies.json"

            );

            return store.companies;

        }

        catch {

            return [];

        }

    }


    async function getContests() {

        try {

            if (store.contests)
                return store.contests;

            store.contests = validateArray(

                await fetchJSON("contest.json"),

                "contest.json"

            );

            return store.contests;

        }

        catch {

            return [];

        }

    }


    async function getBadges() {

        try {

            if (store.badges)
                return store.badges;

            store.badges = validateArray(

                await fetchJSON("badges.json"),

                "badges.json"

            );

            return store.badges;

        }

        catch {

            return [];

        }

    }


    /* ==========================================================================
       Load Everything
       ========================================================================== */

    async function loadAll() {

        await Promise.all([

            getProfile(),

            getStats(),

            getQuestions(),

            getSubmissions(),

            getHeatmap(),

            getTags(),

            getLanguages(),

            getCompanies(),

            getContests(),

            getBadges()

        ]);

        return store;

    }


    /* ==========================================================================
       Refresh
       ========================================================================== */

    async function refresh() {

        clearCache();

        return loadAll();

    }


    /* ==========================================================================
       Cache Management
       ========================================================================== */

    function clearMemoryCache() {

        Object.keys(memoryCache).forEach(key => {

            delete memoryCache[key];

        });

    }


    function clearLocalCache() {

        Object.keys(localStorage).forEach(key => {

            if (

                key.startsWith(

                    `leetcode-${CONFIG.CACHE_VERSION}`

                )

            ) {

                localStorage.removeItem(key);

            }

        });

    }


    function clearCache() {

        clearMemoryCache();

        clearLocalCache();

        Object.keys(store).forEach(key => {

            store[key] = null;

        });

    }


    /* ==========================================================================
       Preload
       ========================================================================== */

    async function preload() {

        try {

            await loadAll();

            log("Data preloaded");

        }

        catch (error) {

            console.error(error);

        }

    }
    /* ==========================================================================
       Questions Lookup
       ========================================================================== */

    async function getQuestionsBySlug() {

        const questions = await getQuestions();

        const map = {};

        questions.forEach(question => {

            if (question.title_slug) {

                map[question.title_slug] = question;

            }

        });

        return map;

    }


    /* ==========================================================================
       Solved Questions
       ========================================================================== */

    async function getSolvedQuestions() {

        const questions = await getQuestions();

        return questions.filter(

            question => question.status === "SOLVED"

        );

    }


    /* ==========================================================================
       Accepted Submissions
       ========================================================================== */

    async function getAcceptedSubmissions() {

        const submissions = await getSubmissions();

        return submissions.filter(sub => {

            return (

                sub.status === "Accepted" ||

                sub.status_display === "Accepted"

            );

        });

    }


    /* ==========================================================================
       Active Days
       ========================================================================== */

    async function getActiveDays() {

        const heatmap = await getHeatmap();

        return heatmap.filter(

            day => day.count > 0

        ).length;

    }


    /* ==========================================================================
       Acceptance Rate
       ========================================================================== */

    async function getAcceptanceRate() {

        const stats = await getStats();

        return Number(

            stats.acceptanceRate || 0

        );

    }


    /* ==========================================================================
       Difficulty Statistics
       ========================================================================== */

    async function getDifficultyStats() {

        const questions = await getSolvedQuestions();

        const stats = {

            EASY: 0,

            MEDIUM: 0,

            HARD: 0

        };

        questions.forEach(question => {

            if (stats[question.difficulty] !== undefined) {

                stats[question.difficulty]++;

            }

        });

        return stats;

    }


    /* ==========================================================================
       Monthly Statistics
       ========================================================================== */

    async function getMonthlyStats() {

        const solved =

            await getSolvedQuestions();

        const months = {};

        solved.forEach(question => {

            if (!question.last_submitted_at)

                return;

            const date =

                new Date(

                    question.last_submitted_at

                );

            const key =

                date.getFullYear() +

                "-" +

                String(

                    date.getMonth() + 1

                ).padStart(2, "0");

            months[key] = (months[key] || 0) + 1;

        });

        return months;

    }


    /* ==========================================================================
       Weekly Statistics
       ========================================================================== */

    async function getWeeklyStats() {

        const submissions =

            await getSubmissions();

        const values = [

            0, 0, 0, 0, 0, 0, 0

        ];

        submissions.forEach(sub => {

            if (!sub.timestamp)

                return;

            const date =

                new Date(

                    Number(sub.timestamp) * 1000

                );

            let day = date.getDay();

            day = (day + 6) % 7;

            values[day]++;

        });

        return {

            labels: [

                "Mon",

                "Tue",

                "Wed",

                "Thu",

                "Fri",

                "Sat",

                "Sun"

            ],

            values

        };

    }


    /* ==========================================================================
       Hourly Statistics
       ========================================================================== */

    async function getHourlyStats() {

        const submissions =

            await getSubmissions();

        const hours =

            new Array(24).fill(0);

        submissions.forEach(sub => {

            if (!sub.timestamp)

                return;

            const date =

                new Date(

                    Number(sub.timestamp) * 1000

                );

            hours[

                date.getHours()

            ]++;

        });

        return hours;

    }


    /* ==========================================================================
       Language Statistics
       ========================================================================== */

    async function getLanguageStats() {

        const languages =

            await getLanguages();

        return [...languages]

            .sort(

                (a, b) => b.count - a.count

            );

    }


    /* ==========================================================================
       Tag Statistics
       ========================================================================== */

    async function getTagStats() {

        const tags =

            await getTags();

        return [...tags]

            .sort(

                (a, b) => b.count - a.count

            );

    }


    /* ==========================================================================
       Current & Longest Streak
       ========================================================================== */

    async function getStreaks() {

        const heatmap =

            await getHeatmap();

        const active =

            heatmap

                .filter(d => d.count > 0)

                .map(d => d.date)

                .sort();

        if (active.length === 0) {

            return {

                current: 0,

                longest: 0

            };

        }

        let longest = 1;

        let run = 1;

        for (

            let i = 1;

            i < active.length;

            i++

        ) {

            const previous =

                new Date(active[i - 1]);

            const current =

                new Date(active[i]);

            const diff =

                (

                    current -

                    previous

                ) / 86400000;

            if (diff === 1) {

                run++;

            }

            else {

                longest = Math.max(

                    longest,

                    run

                );

                run = 1;

            }

        }

        longest = Math.max(

            longest,

            run

        );

        let current = 0;

        const set =

            new Set(active);

        const cursor =

            new Date();

        cursor.setHours(

            0,

            0,

            0,

            0

        );

        const key = date =>

            date

                .toISOString()

                .slice(0, 10);

        if (

            !set.has(

                key(cursor)

            )

        ) {

            cursor.setDate(

                cursor.getDate() - 1

            );

        }

        while (

            set.has(

                key(cursor)

            )

        ) {

            current++;

            cursor.setDate(

                cursor.getDate() - 1

            );

        }

        return {

            current,

            longest

        };

    }


    /* ==========================================================================
       Dashboard Summary
       ========================================================================== */

    async function getDashboardSummary() {

        const [

            profile,

            stats,

            streaks,

            activeDays,

            solved

        ] = await Promise.all([

            getProfile(),

            getStats(),

            getStreaks(),

            getActiveDays(),

            getSolvedQuestions()

        ]);

        return {

            username:

                profile.username,

            solved:

                solved.length,

            submissions:

                stats.totalSubmissions,

            acceptance:

                stats.acceptanceRate,

            currentStreak:

                streaks.current,

            longestStreak:

                streaks.longest,

            activeDays

        };

    }
    /* ========================================================================
       Advanced Analytics Helpers
       ======================================================================== */


    /**
     * Calculate complete difficulty statistics
     */
    async function getDifficultyStats() {

        const questions = await getQuestions();


        const result = {

            EASY: 0,

            MEDIUM: 0,

            HARD: 0

        };


        questions.forEach(q => {


            if (
                q.status === "SOLVED" &&
                result[q.difficulty] !== undefined
            ) {

                result[q.difficulty]++;

            }


        });


        return result;

    }



    /**
     * Calculate solved question count
     */
    async function getSolvedCount() {

        const questions = await getQuestions();


        return questions.filter(

            q => q.status === "SOLVED"

        ).length;

    }





    /**
     * Calculate acceptance rate
     * based on submissions
     */
    async function getAcceptanceRate() {


        const submissions = await getSubmissions();


        if (
            !submissions ||
            submissions.length === 0
        ) {

            return 0;

        }


        let accepted = 0;


        submissions.forEach(sub => {


            if (

                sub.status === "Accepted" ||

                sub.status_display === "Accepted" ||

                sub.status_code === 10

            ) {

                accepted++;

            }


        });



        return (

            accepted /

            submissions.length *

            100

        );


    }





    /**
     * Generate complete stats object
     */
    async function generateStats() {


        const [

            difficulty,

            solved,

            acceptance,

            submissions

        ] = await Promise.all([


            getDifficultyStats(),

            getSolvedCount(),

            getAcceptanceRate(),

            getSubmissions()


        ]);



        return {


            totalSolved:

                solved,


            totalSubmissions:

                submissions.length,


            acceptanceRate:

                Number(
                    acceptance.toFixed(2)
                ),


            difficultyCounts:

                difficulty


        };


    }







    /**
     * Language statistics
     */
    async function generateLanguageStats() {


        const submissions =
            await getSubmissions();


        const map = {};



        submissions.forEach(sub => {


            const lang =

                sub.lang ||

                sub.language ||

                "Unknown";



            if (!map[lang]) {

                map[lang] = 0;

            }


            map[lang]++;


        });



        return Object.keys(map)

            .map(lang => ({


                language: lang,


                count: map[lang]


            }))


            .sort(

                (a, b) =>

                    b.count - a.count

            );


    }







    /**
     * Tag based statistics
     */
    async function generateTagStats() {


        const questions =
            await getQuestions();


        const map = {};



        questions.forEach(q => {


            if (
                q.status !== "SOLVED"
            ) {

                return;

            }



            if (
                !q.tags
            ) {

                return;

            }



            q.tags.forEach(tag => {


                if (!map[tag]) {

                    map[tag] = 0;

                }


                map[tag]++;


            });



        });




        return Object.keys(map)

            .map(tag => ({


                tag,


                count: map[tag]


            }))


            .sort(

                (a, b) =>

                    b.count - a.count

            );


    }







    /**
     * Submission status summary
     */
    async function getSubmissionStatus() {


        const submissions =
            await getSubmissions();



        let accepted = 0;

        let failed = 0;



        submissions.forEach(sub => {


            if (

                sub.status === "Accepted" ||

                sub.status_display === "Accepted" ||

                sub.status_code === 10

            ) {

                accepted++;

            }

            else {


                failed++;

            }


        });



        return {


            accepted,

            failed,


            total:

                submissions.length


        };


    }







    /**
     * Daily submission count
     */
    async function getDailySubmissionStats() {


        const submissions =
            await getSubmissions();



        const days = {};



        submissions.forEach(sub => {


            if (!sub.timestamp) {

                return;

            }



            const date =

                new Date(

                    Number(sub.timestamp) * 1000

                )

                    .toISOString()

                    .slice(0, 10);



            if (!days[date]) {

                days[date] = 0;

            }


            days[date]++;



        });



        return Object.keys(days)

            .map(date => ({


                date,


                count: days[date]


            }))


            .sort(

                (a, b) =>

                    new Date(a.date) -

                    new Date(b.date)

            );


    }







    /**
     * Monthly solved trend
     */
    async function getMonthlySolved() {


        const questions =
            await getQuestions();


        const months = {};



        questions.forEach(q => {


            if (

                q.status !== "SOLVED" ||

                !q.last_submitted_at

            ) {

                return;

            }



            const d =

                new Date(
                    q.last_submitted_at
                );



            const key =

                `${d.getFullYear()}-${String(
                    d.getMonth() + 1
                ).padStart(2, "0")

                }`;



            months[key] =

                (months[key] || 0) + 1;



        });



        return months;


    }
    /* ========================================================================
     Cache Management
     ======================================================================== */

    async function refreshAll() {

        clearCache();

        await Promise.all([

            getStats(),
            getProfile(),
            getQuestions(),
            getSubmissions(),
            getHeatmap(),
            getTags(),
            getLanguages()

        ]);

    }



    /* ========================================================================
       Data Validation
       ======================================================================== */

    async function validateData() {

        const report = {

            profile: false,
            stats: false,
            questions: false,
            submissions: false,
            heatmap: false,
            tags: false,
            languages: false,

            valid: false

        };

        try {

            report.profile =
                !!(await getProfile());

            report.stats =
                !!(await getStats());

            report.questions =
                Array.isArray(await getQuestions());

            report.submissions =
                Array.isArray(await getSubmissions());

            report.heatmap =
                Array.isArray(await getHeatmap());

            report.tags =
                Array.isArray(await getTags());

            report.languages =
                Array.isArray(await getLanguages());

            report.valid =

                report.profile &&
                report.stats &&
                report.questions &&
                report.submissions &&
                report.heatmap &&
                report.tags &&
                report.languages;

        }

        catch (e) {

            report.valid = false;

        }

        return report;

    }



    /* ========================================================================
       Generic File Loader
       ======================================================================== */

    async function load(file) {

        return fetchJSON(file);

    }



    /* ========================================================================
       Generic Reload
       ======================================================================== */

    async function reload(file) {

        delete cache[file];

        return fetchJSON(file);

    }



    /* ========================================================================
       Total Dataset Information
       ======================================================================== */

    async function datasetInfo() {

        const [

            profile,
            questions,
            submissions,
            tags,
            languages,
            heatmap

        ] = await Promise.all([

            getProfile(),
            getQuestions(),
            getSubmissions(),
            getTags(),
            getLanguages(),
            getHeatmap()

        ]);



        return {

            username:

                profile.username,

            totalQuestions:

                questions.length,

            totalSubmissions:

                submissions.length,

            totalTags:

                tags.length,

            totalLanguages:

                languages.length,

            heatmapDays:

                heatmap.length,

            generatedAt:

                profile.lastUpdated

        };

    }



    /* ========================================================================
       Version Information
       ======================================================================== */

    const VERSION = "2.0.0";



    /* ========================================================================
       Public API
       ======================================================================== */

    return {

        VERSION,

        load,

        reload,

        clearCache,

        refreshAll,

        validateData,

        datasetInfo,

        fetchJSON,

        getStats,

        getProfile,

        getQuestions,

        getSubmissions,

        getHeatmap,

        getTags,

        getLanguages,

        getQuestionsBySlug,

        getStreaks,

        getDifficultyStats,

        getSolvedCount,

        getAcceptanceRate,

        generateStats,

        generateLanguageStats,

        generateTagStats,

        getSubmissionStatus,

        getDailySubmissionStats,

        getMonthlySolved

    };

})();