from __future__ import annotations

import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional


class GitHubPush:
   
    def __init__(self, repo_dir: Optional[Path] = None) -> None:
        # self.repo_dir: Path = repo_dir or Path.cwd()
        self.repo_dir: Path = repo_dir or Path(__file__).parent

    def _run(self, args: List[str]) -> subprocess.CompletedProcess:
        return subprocess.run(
            args,
            cwd=self.repo_dir,
            text=True,
            capture_output=True,
        )

    def add(self) -> bool:
        result = self._run(["git", "add", "."])
        if result.returncode != 0:
            print(result.stderr.strip())
            return False
        return True

    def commit(self) -> bool:
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
        result = self._run(["git", "push"])
        if result.returncode != 0:
            print(result.stderr.strip())
            return False
        print("\n\u2713 GitHub Updated Successfully")
        return True

    def push(self) -> bool:
        print("=" * 50)
        print("Pushing to GitHub")
        print("=" * 50)
        print(f"Repository: {self.repo_dir}")
        if not self.add():
            return False
        if not self.commit():
            return False
        return self._git_push()

    def run(self) -> None:
        self.push()


if __name__ == "__main__":
    GitHubPush().run()
