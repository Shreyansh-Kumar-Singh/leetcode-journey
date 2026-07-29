from api import LeetCodeAPI
from database import Database

import time
from pathlib import Path


class CodeSync:

    def __init__(self, db: Database):

        self.db = db
        self.api = LeetCodeAPI()

        self.downloaded = 0
        self.failed = 0

        self.output = Path("output/solutions")
        self.output.mkdir(
            parents=True,
            exist_ok=True
        )

    ###########################################################
    # PUBLIC
    ###########################################################

    def sync(self):

        ids = self.db.get_submission_without_code()

        total = len(ids)

        print()

        print(
            f"Downloading Source Code ({total} submissions)"
        )

        print()

        for index, submission_id in enumerate(ids, start=1):

            print(
                f"[{index}/{total}] {submission_id}"
            )

            try:

                self.download_submission_code(
                    submission_id
                )

            except Exception as e:

                self.failed += 1

                print(e)

        self.db.commit()

        print()

        print("Finished")

        print(
            f"Downloaded : {self.downloaded}"
        )

        print(
            f"Failed : {self.failed}"
        )

    ###########################################################
    # DOWNLOAD ONE SUBMISSION
    ###########################################################

    def download_submission_code(
        self,
        submission_id
    ):

        details = self.fetch_details(
            submission_id
        )

        code = details.get("code")

        if not code:

            return

        self.db.update_submission_code(

            submission_id,

            code

        )

        self.export_file(

            submission_id,

            details,

            code

        )

        self.downloaded += 1
            ###########################################################
    # FETCH SUBMISSION DETAILS
    ###########################################################

    def fetch_details(
        self,
        submission_id
    ):

        retries = 3

        for attempt in range(retries):

            try:

                return self.api.get_submission_details(
                    submission_id
                )

            except Exception as e:

                print(
                    f"Retry {attempt + 1}/{retries}"
                )

                time.sleep(2)

        raise Exception(

            f"Unable to download submission {submission_id}"

        )

    ###########################################################
    # EXPORT SOURCE FILE
    ###########################################################

    def export_file(

        self,

        submission_id,

        details,

        code

    ):

        language = details["lang"]["name"]

        slug = details["question"]["titleSlug"]

        extension = self.get_extension(
            language
        )

        folder = self.output / language

        folder.mkdir(

            parents=True,

            exist_ok=True

        )

        filename = (

            f"{slug}_{submission_id}.{extension}"

        )

        filepath = folder / filename

        with open(

            filepath,

            "w",

            encoding="utf-8"

        ) as f:

            f.write(code)

    ###########################################################
    # LANGUAGE EXTENSIONS
    ###########################################################

    def get_extension(
        self,
        language
    ):

        mapping = {

            "C": "c",

            "C++": "cpp",

            "Java": "java",

            "Python": "py",

            "Python3": "py",

            "JavaScript": "js",

            "TypeScript": "ts",

            "Go": "go",

            "Rust": "rs",

            "Kotlin": "kt",

            "Swift": "swift",

            "PHP": "php",

            "Ruby": "rb",

            "Scala": "scala",

            "C#": "cs"

        }

        return mapping.get(
            language,
            "txt"
        )
    
        ###########################################################
    # BATCH COMMIT
    ###########################################################

    def batch_commit(self):

        try:

            self.db.commit()

        except Exception:

            self.db.rollback()

            raise

    ###########################################################
    # RESUME SUPPORT
    ###########################################################

    def resume(self):

        print("\nResuming source code download...\n")

        self.sync()

    ###########################################################
    # STATISTICS
    ###########################################################

    def statistics(self):

        print("\n" + "=" * 60)

        print("Source Code Download Summary")

        print("=" * 60)

        print(f"Downloaded : {self.downloaded}")

        print(f"Failed      : {self.failed}")

        remaining = len(self.db.get_submission_without_code())

        print(f"Remaining   : {remaining}")

        print("=" * 60)

    ###########################################################
    # RUN
    ###########################################################

    def run(self):

        try:

            self.sync()

            self.batch_commit()

            self.statistics()

        except KeyboardInterrupt:

            print("\nInterrupted by user.")

            self.batch_commit()

        except Exception as e:

            print("\nUnexpected Error")

            print(e)

            self.db.rollback()

            raise

        finally:

            print("\nSource code synchronization complete.")