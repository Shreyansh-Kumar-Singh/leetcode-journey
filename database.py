import sqlite3
import json
from pathlib import Path


class Database:

    def __init__(self, db_path):

        Path(db_path).parent.mkdir(
            parents=True,
            exist_ok=True
        )

        self.conn = sqlite3.connect(db_path)

        self.conn.execute(
            "PRAGMA foreign_keys = ON"
        )

        self.cursor = self.conn.cursor()

        self.create_tables()

    ####################################################
    # TABLES
    ####################################################

    def create_tables(self):

        self.cursor.executescript("""

        CREATE TABLE IF NOT EXISTS questions(

            frontend_id TEXT PRIMARY KEY,

            title TEXT,

            title_slug TEXT UNIQUE,

            difficulty TEXT,

            question_status TEXT,

            last_result TEXT,

            last_submitted_at TEXT,

            num_submitted INTEGER

        );



        CREATE TABLE IF NOT EXISTS tags(

            slug TEXT PRIMARY KEY,

            name TEXT

        );



        CREATE TABLE IF NOT EXISTS question_tags(

            question_slug TEXT,

            tag_slug TEXT,

            PRIMARY KEY(question_slug, tag_slug)

        );



        CREATE TABLE IF NOT EXISTS submissions(

            submission_id TEXT PRIMARY KEY,

            question_slug TEXT,

            language TEXT,

            language_name TEXT,

            status INTEGER,

            status_display TEXT,

            runtime TEXT,

            memory TEXT,

            timestamp TEXT,

            url TEXT,

            code TEXT,

            raw_json TEXT

        );



        CREATE INDEX IF NOT EXISTS idx_submission_slug

        ON submissions(question_slug);

        """)

        self.conn.commit()

    ####################################################
    # QUESTIONS
    ####################################################

    def insert_question(self, q):

        self.cursor.execute("""

        INSERT OR REPLACE INTO questions(

            frontend_id,

            title,

            title_slug,

            difficulty,

            question_status,

            last_result,

            last_submitted_at,

            num_submitted

        )

        VALUES(?,?,?,?,?,?,?,?)

        """, (

            q["frontendId"],

            q["title"],

            q["titleSlug"],

            q["difficulty"],

            q.get("questionStatus"),

            q.get("lastResult"),

            q.get("lastSubmittedAt"),

            q.get("numSubmitted")

        ))

        for tag in q.get("topicTags", []):

            self.cursor.execute("""

            INSERT OR IGNORE INTO tags

            VALUES(?,?)

            """, (

                tag["slug"],

                tag["name"]

            ))

            self.cursor.execute("""

            INSERT OR IGNORE INTO question_tags

            VALUES(?,?)

            """, (

                q["titleSlug"],

                tag["slug"]

            ))

    ####################################################
    # SUBMISSIONS
    ####################################################

    def insert_submission(self, submission):

        self.cursor.execute("""

        INSERT OR REPLACE INTO submissions(

            submission_id,

            question_slug,

            language,

            language_name,

            status,

            status_display,

            runtime,

            memory,

            timestamp,

            url,

            code,

            raw_json

        )

        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)

        """, (

            submission["id"],

            submission["titleSlug"],

            submission["lang"],

            submission["langName"],

            submission["status"],

            submission["statusDisplay"],

            submission["runtime"],

            submission["memory"],

            submission["timestamp"],

            submission["url"],

            submission.get("code", ""),

            json.dumps(submission)

        ))

    ####################################################
    # UPDATE SOURCE CODE
    ####################################################

    def update_submission_code(

        self,

        submission_id,

        code

    ):

        self.cursor.execute("""

        UPDATE submissions

        SET code=?

        WHERE submission_id=?

        """, (

            code,

            submission_id

        ))

    ####################################################
    # CHECKS
    ####################################################

    def submission_exists(

        self,

        submission_id

    ):

        self.cursor.execute("""

        SELECT 1

        FROM submissions

        WHERE submission_id=?

        LIMIT 1

        """, (

            submission_id,

        ))

        return self.cursor.fetchone() is not None

    ####################################################
    # GETTERS
    ####################################################

    def get_all_questions(self):

        self.cursor.execute("""

        SELECT

            title_slug,

            title

        FROM questions

        ORDER BY frontend_id

        """)

        return self.cursor.fetchall()

    def get_all_submission_ids(self):

        self.cursor.execute("""

        SELECT submission_id

        FROM submissions

        """)

        return [

            row[0]

            for row in self.cursor.fetchall()

        ]

    def get_submission_without_code(self):

        self.cursor.execute("""

        SELECT submission_id

        FROM submissions

        WHERE code IS NULL

           OR code=''

        """)

        return [

            row[0]

            for row in self.cursor.fetchall()

        ]

    ####################################################
    # STATISTICS
    ####################################################

    def question_count(self):

        self.cursor.execute(

            "SELECT COUNT(*) FROM questions"

        )

        return self.cursor.fetchone()[0]

    def submission_count(self):

        self.cursor.execute(

            "SELECT COUNT(*) FROM submissions"

        )

        return self.cursor.fetchone()[0]

    ####################################################
    # TRANSACTION
    ####################################################

    def commit(self):

        self.conn.commit()

    def rollback(self):

        self.conn.rollback()

    ####################################################
    # CLOSE
    ####################################################

    def close(self):

        self.conn.close()