"""Shared base class for all JSON exporters.

Every concrete exporter (profile, stats, questions, submissions, heatmap,
tags, languages) inherits from :class:`BaseExporter` so that the
"open a cursor / write a JSON file" behaviour is written exactly once.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any


class BaseExporter:
    """Base class providing the shared ``save_json`` helper.

    Attributes:
        cursor: A shared ``sqlite3.Cursor`` (with ``row_factory =
            sqlite3.Row``) used to read from the LeetCode database.
        output_dir: The directory (``output/data``) where JSON files
            are written.
    """

    def __init__(self, cursor: sqlite3.Cursor, output_dir: Path) -> None:
        """Initialize the exporter.

        Args:
            cursor: Shared database cursor.
            output_dir: Destination directory for JSON output.
        """
        self.cursor = cursor
        self.output_dir = output_dir

    def save_json(self, filename: str, data: Any) -> None:
        """Serialize ``data`` to ``output_dir/filename`` as pretty JSON.

        Args:
            filename: Name of the file to write, e.g. ``"profile.json"``.
            data: A JSON-serializable object (dict or list).

        Raises:
            OSError: If the file cannot be written.
        """
        path = self.output_dir / filename

        try:
            with path.open("w", encoding="utf-8") as file_handle:
                json.dump(data, file_handle, indent=4, ensure_ascii=False)
            print(f"  \u2713 {filename}")
        except OSError as exc:
            print(f"  \u2717 Failed to write {filename}: {exc}")
            raise

    def export(self) -> None:
        """Build the exporter's data and write it to disk.

        Subclasses must override this method.
        """
        raise NotImplementedError("Subclasses must implement export().")
