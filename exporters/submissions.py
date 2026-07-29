"""Exports ``submissions.json`` -- every submission (without source code)."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from exporters.base import BaseExporter


class SubmissionsExporter(BaseExporter):
    """Builds and writes ``submissions.json``.

    Source code and raw GraphQL payloads are intentionally excluded to
    keep the file small; the website only needs metadata. Output shape
    (per item)::

        {
            "submission_id": "2051669268",
            "question_slug": "two-sum",
            "language": "c",
            "language_name": "C",
            "runtime": "99 ms",
            "memory": "9.5 MB",
            "timestamp": "1782852152",
            "status": 10,
            "status_display": "Accepted",
            "url": "/submissions/detail/2051669268/"
        }
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the submissions exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _fetch_submissions(self) -> List[sqlite3.Row]:
        """Return every row in ``submissions``, newest first."""
        self.cursor.execute(
            """
            SELECT
                submission_id,
                question_slug,
                language,
                language_name,
                runtime,
                memory,
                timestamp,
                status,
                status_display,
                url
            FROM submissions
            ORDER BY CAST(timestamp AS INTEGER) DESC
            """
        )
        return self.cursor.fetchall()

    def build(self) -> List[Dict[str, Any]]:
        """Assemble the list of submission objects.

        Returns:
            A list of dictionaries matching the ``submissions.json`` schema.

        Raises:
            sqlite3.Error: If the underlying query fails.
        """
        try:
            rows = self._fetch_submissions()
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building submissions data: {exc}")
            raise

        return [dict(row) for row in rows]

    def export(self) -> None:
        """Build and persist ``submissions.json``."""
        data = self.build()
        self.save_json("submissions.json", data)
