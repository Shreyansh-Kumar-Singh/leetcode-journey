"""Coordinator that runs every JSON exporter to produce ``docs/data/*.json``.

Usage:
    python -m exporters.json_exporter

or, programmatically::

    from exporters.json_exporter import JSONExporter
    JSONExporter().export()
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import List, Optional

from config import Config

from exporters.base import BaseExporter
from exporters.heatmap import HeatmapExporter
from exporters.languages import LanguagesExporter
from exporters.profile import ProfileExporter
from exporters.questions import QuestionsExporter
from exporters.stats import StatsExporter
from exporters.submissions import SubmissionsExporter
from exporters.tags import TagsExporter


class JSONExporter:
    """Coordinates all individual exporters against a shared connection.

    Responsible for:
        * Ensuring ``output/data/`` exists.
        * Opening a single SQLite connection/cursor shared by every
          exporter (so each exporter does not have to manage its own).
        * Calling ``export()`` on each registered exporter, in order.
    """

    OUTPUT_DIR: Path = Path("docs") / "data"

    def __init__(self, db_path: Optional[str] = None) -> None:
        """Initialize the coordinator.

        Args:
            db_path: Path to the SQLite database. Defaults to
                ``Config.DATABASE`` when not provided.
        """
        self.db_path: str = db_path or Config.DATABASE
        self.conn: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None

    def _prepare_output_dir(self) -> None:
        """Create ``docs/data/`` if it does not already exist."""
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def _connect(self) -> None:
        """Open the shared SQLite connection and cursor.

        Raises:
            sqlite3.Error: If the database cannot be opened.
        """
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            self.cursor = self.conn.cursor()
        except sqlite3.Error as exc:
            print(f"  \u2717 Failed to open database at {self.db_path}: {exc}")
            raise

    def _close(self) -> None:
        """Close the shared SQLite connection, if open."""
        if self.conn is not None:
            self.conn.close()
            self.conn = None
            self.cursor = None

    def _build_exporters(self) -> List[BaseExporter]:
        """Instantiate every exporter with the shared cursor and output dir.

        Returns:
            The list of exporter instances to run, in execution order.
        """
        assert self.cursor is not None  # set by _connect()

        return [
            ProfileExporter(self.cursor, self.OUTPUT_DIR),
            StatsExporter(self.cursor, self.OUTPUT_DIR),
            QuestionsExporter(self.cursor, self.OUTPUT_DIR),
            SubmissionsExporter(self.cursor, self.OUTPUT_DIR),
            HeatmapExporter(self.cursor, self.OUTPUT_DIR),
            TagsExporter(self.cursor, self.OUTPUT_DIR),
            LanguagesExporter(self.cursor, self.OUTPUT_DIR),
        ]

    def export(self) -> None:
        """Run every exporter and write all JSON files to ``output/data/``."""
        print("=" * 50)
        print("Generating JSON Files")
        print("=" * 50)

        self._prepare_output_dir()
        self._connect()

        try:
            for exporter in self._build_exporters():
                exporter.export()
        finally:
            self._close()

        print("\nJSON Export Completed.\n")


if __name__ == "__main__":
    JSONExporter().export()
