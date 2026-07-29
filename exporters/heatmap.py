"""Exports ``heatmap.json`` -- GitHub-style daily submission counts."""

from __future__ import annotations

import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from exporters.base import BaseExporter


class HeatmapExporter(BaseExporter):
    """Builds and writes ``heatmap.json``.

    Submissions are grouped by calendar day (UTC), based on their epoch
    ``timestamp``. Output shape::

        [
            {"date": "2026-01-01", "count": 3},
            {"date": "2026-01-02", "count": 1}
        ]
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the heatmap exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        super().__init__(cursor, output_dir)

    def _fetch_timestamps(self) -> List[str]:
        """Return every non-null ``timestamp`` value from ``submissions``."""
        self.cursor.execute(
            "SELECT timestamp FROM submissions WHERE timestamp IS NOT NULL"
        )
        return [row[0] for row in self.cursor.fetchall()]

    @staticmethod
    def _to_date(raw_timestamp: str) -> Optional[str]:
        """Convert an epoch-seconds string to an ``YYYY-MM-DD`` UTC date.

        Args:
            raw_timestamp: The submission's epoch timestamp as a string.

        Returns:
            The formatted date, or ``None`` if the value can't be parsed.
        """
        try:
            epoch_seconds = int(raw_timestamp)
            return datetime.fromtimestamp(
                epoch_seconds, tz=timezone.utc
            ).strftime("%Y-%m-%d")
        except (ValueError, TypeError, OSError):
            return None

    def build(self) -> List[Dict[str, Any]]:
        """Assemble the list of ``{date, count}`` heatmap entries.

        Returns:
            A list of dictionaries matching the ``heatmap.json`` schema,
            sorted chronologically.

        Raises:
            sqlite3.Error: If the underlying query fails.
        """
        try:
            timestamps = self._fetch_timestamps()
        except sqlite3.Error as exc:
            print(f"  \u2717 Error building heatmap data: {exc}")
            raise

        day_counts: Counter = Counter()
        for raw_timestamp in timestamps:
            date_str = self._to_date(raw_timestamp)
            if date_str is not None:
                day_counts[date_str] += 1

        return [
            {"date": date_str, "count": count}
            for date_str, count in sorted(day_counts.items())
        ]

    def export(self) -> None:
        """Build and persist ``heatmap.json``."""
        data = self.build()
        self.save_json("heatmap.json", data)
