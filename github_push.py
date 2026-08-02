from __future__ import annotations

import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional


class GitHubPush:
   

    def __init__(self, repo_dir: Optional[Path] = None) -> None:
        """Initialize the pusher.

        Args:
            repo_dir: Path to the git repository. Defaults to ``Path.cwd()``.
        """
        self.repo_dir: Path = repo_dir or Path.cwd()

    def _run(self, args: List[str]) -> subprocess.CompletedProcess:
        """Run a git command via subprocess and capture its output.

        Args:
            args: The command and its arguments, e.g. ``["git", "add", "."]``.

        Returns:
            The completed process, with ``stdout``/``stderr`` captured as text.
        """
        return subprocess.run(
            args,
            cwd=self.repo_dir,
            text=True,
            capture_output=True,
        )

    def add(self) -> bool:
        """Stage all changes with ``git add .``.

        Returns:
            ``True`` on success, ``False`` if the command failed.
        """
        result = self._run(["git", "add", "."])

        if result.returncode != 0:
            print(result.stderr.strip())
            return False

        return True

    def commit(self) -> bool:
        """Commit staged changes with a timestamped message.

        The commit message follows the format
        ``Update LeetCode Data - YYYY-MM-DD HH:MM``.

        Returns:
            ``True`` if a commit was created, ``False`` if there was
            nothing to commit or the command failed.
        """
        message = (
            f"Update LeetCode Data - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )

        result = self._run(["git", "commit", "-m", message])
        combined_output = f"{result.stdout}{result.stderr}".lower()

        if "nothing to commit" in combined_output:
            print("Nothing to commit.")
            return False

        if result.returncode != 0:
            print(result.stderr.strip())
            return False

        print(result.stdout.strip())
        return True

    def _git_push(self) -> bool:
        """Run ``git push`` against the configured remote.

        Returns:
            ``True`` on success, ``False`` if the command failed.
        """
        result = self._run(["git", "push"])

        if result.returncode != 0:
            print(result.stderr.strip())
            return False

        print("\n\u2713 GitHub Updated Successfully")
        return True

    def push(self) -> bool:
        """Run the full add -> commit -> push workflow.

        This is the single entry point used by the update pipeline.

        Returns:
            ``True`` if changes were pushed, ``False`` if there was
            nothing to commit or any step failed.
        """
        print("=" * 50)
        print("Pushing to GitHub")
        print("=" * 50)

        if not self.add():
            return False

        if not self.commit():
            return False

        return self._git_push()

    def run(self) -> None:
        """Convenience entry point for running this module as a script."""
        self.push()


if __name__ == "__main__":
    GitHubPush().run()
