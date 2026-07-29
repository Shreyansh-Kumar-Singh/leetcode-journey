import os
import json
import sqlite3
from datetime import datetime

from config import DATABASE


class JSONExporter:
    def __init__(self):
        self.conn = sqlite3.connect(DATABASE)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()

        self.output_dir = os.path.join("docs", "data")
        os.makedirs(self.output_dir, exist_ok=True)

    def save_json(self, filename, data):
        path = os.path.join(self.output_dir, filename)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        print(f"✓ {filename}")

    def export_questions(self):
        self.cursor.execute("SELECT * FROM questions")
        rows = self.cursor.fetchall()

        questions = [dict(row) for row in rows]

        self.save_json("questions.json", questions)

    def export_submissions(self):
        self.cursor.execute("SELECT * FROM submissions")
        rows = self.cursor.fetchall()

        submissions = [dict(row) for row in rows]

        self.save_json("submissions.json", submissions)

    def export_stats(self):
        self.cursor.execute("SELECT COUNT(*) FROM questions")
        total_questions = self.cursor.fetchone()[0]

        self.cursor.execute("""
            SELECT difficulty, COUNT(*)
            FROM questions
            GROUP BY difficulty
        """)

        difficulty = {}

        for row in self.cursor.fetchall():
            difficulty[row[0]] = row[1]

        self.cursor.execute("SELECT COUNT(*) FROM submissions")
        total_submissions = self.cursor.fetchone()[0]

        stats = {
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "total_questions": total_questions,
            "total_submissions": total_submissions,
            "difficulty": difficulty
        }

        self.save_json("stats.json", stats)

    def export(self):
        print("=" * 50)
        print("Generating JSON Files")
        print("=" * 50)

        self.export_questions()
        self.export_submissions()
        self.export_stats()

        print("\nJSON Export Completed.\n")

        self.conn.close()


if __name__ == "__main__":
    JSONExporter().export()