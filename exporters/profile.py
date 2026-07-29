"""Exports ``profile.json`` -- a high level summary of the user's profile."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

from config import Config

from exporters.base import BaseExporter


class ProfileExporter(BaseExporter):
    """Builds and writes ``profile.json``.

    Output shape::

        {
            "username": "someUser",
            "totalSolved": 120,
            "easySolved": 60,
            "mediumSolved": 50,
            "hardSolved": 10,
            "lastUpdated": "2026-07-29T10:00:00+00:00"
        }
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the profile exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _count_solved(self, difficulty: Optional[str] = None) -> int:
        """Count solved questions, optionally filtered by difficulty.

        Args:
            difficulty: One of ``"EASY"``, ``"MEDIUM"``, ``"HARD"``, or
                ``None`` to count all solved questions.

        Returns:
            The number of matching rows.
        """
        if difficulty:
            self.cursor.execute(
                """
                SELECT COUNT(*)
                FROM questions
                WHERE question_status = 'SOLVED' AND difficulty = ?
                """,
                (difficulty,),
            )
        else:
            self.cursor.execute(
                "SELECT COUNT(*) FROM questions WHERE question_status = 'SOLVED'"
            )

        row = self.cursor.fetchone()
        return int(row[0]) if row else 0

    def build(self) -> Dict[str, object]:
        """Assemble the profile data structure.

        Returns:
            A dictionary matching the ``profile.json`` schema.

        Raises:
            sqlite3.Error: If any underlying query fails.
        """
        try:
            total_solved = self._count_solved()
            easy_solved = self._count_solved("EASY")
            medium_solved = self._count_solved("MEDIUM")
            hard_solved = self._count_solved("HARD")
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building profile data: {exc}")
            raise

        return {
            "username": Config.USERNAME or "",
            "totalSolved": total_solved,
            "easySolved": easy_solved,
            "mediumSolved": medium_solved,
            "hardSolved": hard_solved,
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
        }

    def export(self) -> None:
        """Build and persist ``profile.json``."""
        data = self.build()
        self.save_json("profile.json", data)
