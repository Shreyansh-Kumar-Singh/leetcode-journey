"""Exports ``stats.json`` -- aggregate statistics across all data."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict

from exporters.base import BaseExporter


class StatsExporter(BaseExporter):
    """Builds and writes ``stats.json``.

    Output shape::

        {
            "totalQuestions": 500,
            "totalSubmissions": 1200,
            "acceptedSubmissions": 800,
            "acceptanceRate": 66.67,
            "difficultyCounts": {"EASY": 200, "MEDIUM": 250, "HARD": 50},
            "languageCounts": {"C++": 512, "Python3": 88}
        }
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the stats exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _total_questions(self) -> int:
        """Return the total number of rows in ``questions``."""
        self.cursor.execute("SELECT COUNT(*) FROM questions")
        return int(self.cursor.fetchone()[0])

    def _total_submissions(self) -> int:
        """Return the total number of rows in ``submissions``."""
        self.cursor.execute("SELECT COUNT(*) FROM submissions")
        return int(self.cursor.fetchone()[0])

    def _accepted_submissions(self) -> int:
        """Return the number of submissions with an ``Accepted`` status."""
        self.cursor.execute(
            "SELECT COUNT(*) FROM submissions WHERE status_display = 'Accepted'"
        )
        return int(self.cursor.fetchone()[0])

    def _difficulty_counts(self) -> Dict[str, int]:
        """Return question counts grouped by difficulty."""
        self.cursor.execute(
            "SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty"
        )
        return {row[0]: row[1] for row in self.cursor.fetchall() if row[0]}

    def _language_counts(self) -> Dict[str, int]:
        """Return submission counts grouped by language name."""
        self.cursor.execute(
            """
            SELECT language_name, COUNT(*)
            FROM submissions
            GROUP BY language_name
            """
        )
        return {row[0]: row[1] for row in self.cursor.fetchall() if row[0]}

    def build(self) -> Dict[str, object]:
        """Assemble the stats data structure.

        Returns:
            A dictionary matching the ``stats.json`` schema.

        Raises:
            sqlite3.Error: If any underlying query fails.
        """
        try:
            total_questions = self._total_questions()
            total_submissions = self._total_submissions()
            accepted_submissions = self._accepted_submissions()
            difficulty_counts = self._difficulty_counts()
            language_counts = self._language_counts()
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building stats data: {exc}")
            raise

        acceptance_rate = (
            round((accepted_submissions / total_submissions) * 100, 2)
            if total_submissions
            else 0.0
        )

        return {
            "totalQuestions": total_questions,
            "totalSubmissions": total_submissions,
            "acceptedSubmissions": accepted_submissions,
            "acceptanceRate": acceptance_rate,
            "difficultyCounts": difficulty_counts,
            "languageCounts": language_counts,
        }

    def export(self) -> None:
        """Build and persist ``stats.json``."""
        data = self.build()
        self.save_json("stats.json", data)
