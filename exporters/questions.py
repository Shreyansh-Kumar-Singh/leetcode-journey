"""Exports ``questions.json`` -- every question with its resolved tags."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from exporters.base import BaseExporter


class QuestionsExporter(BaseExporter):
    """Builds and writes ``questions.json``.

    One object per question, with tags resolved via ``question_tags`` and
    ``tags``. Output shape (per item)::

        {
            "frontend_id": "1",
            "title": "Two Sum",
            "title_slug": "two-sum",
            "difficulty": "EASY",
            "status": "SOLVED",
            "last_result": "AC",
            "last_submitted_at": "2026-07-28T11:33:25+00:00",
            "num_submitted": 4,
            "tags": ["Array", "Hash Table"]
        }
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the questions exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _fetch_questions(self) -> List[sqlite3.Row]:
        """Return every row in ``questions``, ordered by frontend id."""
        self.cursor.execute(
            "SELECT * FROM questions ORDER BY CAST(frontend_id AS INTEGER)"
        )
        return self.cursor.fetchall()

    def _fetch_tags_by_slug(self) -> Dict[str, List[str]]:
        """Return a mapping of ``title_slug`` to a list of tag names.

        Uses a single joined query instead of one query per question to
        avoid an N+1 query pattern.
        """
        self.cursor.execute(
            """
            SELECT qt.question_slug, t.name
            FROM question_tags qt
            JOIN tags t ON t.slug = qt.tag_slug
            """
        )

        tag_map: Dict[str, List[str]] = {}
        for slug, name in self.cursor.fetchall():
            tag_map.setdefault(slug, []).append(name)
        return tag_map

    def build(self) -> List[Dict[str, Any]]:
        """Assemble the list of question objects.

        Returns:
            A list of dictionaries matching the ``questions.json`` schema.

        Raises:
            sqlite3.Error: If any underlying query fails.
        """
        try:
            rows = self._fetch_questions()
            tag_map = self._fetch_tags_by_slug()
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building questions data: {exc}")
            raise

        questions: List[Dict[str, Any]] = []
        for row in rows:
            questions.append(
                {
                    "frontend_id": row["frontend_id"],
                    "title": row["title"],
                    "title_slug": row["title_slug"],
                    "difficulty": row["difficulty"],
                    "status": row["question_status"],
                    "last_result": row["last_result"],
                    "last_submitted_at": row["last_submitted_at"],
                    "num_submitted": row["num_submitted"],
                    "tags": tag_map.get(row["title_slug"], []),
                }
            )

        return questions

    def export(self) -> None:
        """Build and persist ``questions.json``."""
        data = self.build()
        self.save_json("questions.json", data)
