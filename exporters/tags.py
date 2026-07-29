"""Exports ``tags.json`` -- number of questions tagged with each topic."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from exporters.base import BaseExporter


class TagsExporter(BaseExporter):
    """Builds and writes ``tags.json``.

    Output shape::

        [
            {"tag": "Array", "count": 123},
            {"tag": "Dynamic Programming", "count": 45}
        ]
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the tags exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _fetch_tag_counts(self) -> List[sqlite3.Row]:
        """Return each tag name with the number of questions using it."""
        self.cursor.execute(
            """
            SELECT t.name AS tag, COUNT(qt.question_slug) AS count
            FROM tags t
            JOIN question_tags qt ON qt.tag_slug = t.slug
            GROUP BY t.name
            ORDER BY count DESC
            """
        )
        return self.cursor.fetchall()

    def build(self) -> List[Dict[str, Any]]:
        """Assemble the list of ``{tag, count}`` entries.

        Returns:
            A list of dictionaries matching the ``tags.json`` schema.

        Raises:
            sqlite3.Error: If the underlying query fails.
        """
        try:
            rows = self._fetch_tag_counts()
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building tags data: {exc}")
            raise

        return [{"tag": row["tag"], "count": row["count"]} for row in rows]

    def export(self) -> None:
        """Build and persist ``tags.json``."""
        data = self.build()
        self.save_json("tags.json", data)
