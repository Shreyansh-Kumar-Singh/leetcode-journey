"""End-to-end update pipeline.

Pipeline:
    Exporter.sync()          -- download latest data from LeetCode
        -> JSONExporter.export()  -- regenerate output/data/*.json
        -> GitHubPush.push()      -- commit and push the changes

Usage:
    python update.py
"""

from __future__ import annotations

from exporter import Exporter
from exporters.json_exporter import JSONExporter
from github_push import GitHubPush


def run_pipeline() -> None:
    """Run the full sync -> export -> push pipeline once."""
    exporter = Exporter()

    try:
        exporter.sync()
    finally:
        exporter.close()

    JSONExporter().export()

    GitHubPush().push()


def main() -> None:
    """Script entry point."""
    print("=" * 60)
    print("LeetCode Analytics -- Full Update Pipeline")
    print("=" * 60)

    run_pipeline()

    print("\nPipeline Finished.")


if __name__ == "__main__":
    main()
