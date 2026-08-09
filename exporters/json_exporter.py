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
        * Ensuring every output directory exists.
        * Opening a single SQLite connection/cursor shared by every
          exporter (so each exporter does not have to manage its own).
        * Calling ``export()`` on each registered exporter, for each
          output directory, in order.
    """

    # Both live dashboards read their data from a sibling ``data/``
    # folder (see docs/v1/js/github.js and docs/v2/js/github.js), so
    # every export run has to write to both locations. ``docs/data``
    # is not read by anything and is intentionally not included.
    OUTPUT_DIRS: List[Path] = [
        Path("docs") / "v1" / "data",
        Path("docs") / "v2" / "data",
    ]

    def __init__(self, db_path: Optional[str] = None) -> None:
        """Initialize the coordinator.

        Args:
            db_path: Path to the SQLite database. Defaults to
                ``Config.DATABASE`` when not provided.
        """
        self.db_path: str = db_path or Config.DATABASE
        self.conn: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None

    def _prepare_output_dirs(self) -> None:
        """Create every output directory if it does not already exist."""
        for output_dir in self.OUTPUT_DIRS:
            output_dir.mkdir(parents=True, exist_ok=True)

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

    def _build_exporters(self, output_dir: Path) -> List[BaseExporter]:
        """Instantiate every exporter with the shared cursor and output dir.

        Args:
            output_dir: Destination directory this batch of exporters
                should write to.

        Returns:
            The list of exporter instances to run, in execution order.
        """
        assert self.cursor is not None  # set by _connect()

        return [
            ProfileExporter(self.cursor, output_dir),
            StatsExporter(self.cursor, output_dir),
            QuestionsExporter(self.cursor, output_dir),
            SubmissionsExporter(self.cursor, output_dir),
            HeatmapExporter(self.cursor, output_dir),
            TagsExporter(self.cursor, output_dir),
            LanguagesExporter(self.cursor, output_dir),
        ]

    def export(self) -> None:
        """Run every exporter and write all JSON files to every output dir."""
        print("=" * 50)
        print("Generating JSON Files")
        print("=" * 50)

        self._prepare_output_dirs()
        self._connect()

        try:
            for output_dir in self.OUTPUT_DIRS:
                print(f"\n-> {output_dir}")
                for exporter in self._build_exporters(output_dir):
                    exporter.export()
        finally:
            self._close()

        print("\nJSON Export Completed.\n")


if __name__ == "__main__":
    JSONExporter().export()