"""Exports ``languages.json`` -- number of submissions per language."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from exporters.base import BaseExporter


class LanguagesExporter(BaseExporter):
    """Builds and writes ``languages.json``.

    Output shape::

        [
            {"language": "C++", "count": 512},
            {"language": "Python3", "count": 88}
        ]
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the languages exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _fetch_language_counts(self) -> List[sqlite3.Row]:
        """Return each language name with its total submission count."""
        self.cursor.execute(
            """
            SELECT language_name AS language, COUNT(*) AS count
            FROM submissions
            WHERE language_name IS NOT NULL
            GROUP BY language_name
            ORDER BY count DESC
            """
        )
        return self.cursor.fetchall()

    def build(self) -> List[Dict[str, Any]]:
        """Assemble the list of ``{language, count}`` entries.

        Returns:
            A list of dictionaries matching the ``languages.json`` schema.

        Raises:
            sqlite3.Error: If the underlying query fails.
        """
        try:
            rows = self._fetch_language_counts()
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building languages data: {exc}")
            raise

        return [
            {"language": row["language"], "count": row["count"]} for row in rows
        ]

    def export(self) -> None:
        """Build and persist ``languages.json``."""
        data = self.build()
        self.save_json("languages.json", data)
