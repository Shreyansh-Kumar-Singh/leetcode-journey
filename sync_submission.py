from api import LeetCodeAPI
from database import Database
import time


class SubmissionSync:

    def __init__(self, db: Database):
        self.db = db
        self.api = LeetCodeAPI()

        self.total_questions = 0
        self.total_submissions = 0

    ###########################################################
    # PUBLIC
    ###########################################################

    def sync(self):
        questions = self.db.get_all_questions()

        self.total_questions = len(questions)

        print("\nDownloading Submission Lists...\n")

        for index, (slug, title) in enumerate(questions, start=1):
            print(f"[{index}/{self.total_questions}] {title}")

            self.download_question_submissions(slug)

        self.db.commit()

        print("\nSubmission Sync Complete.")
        print(f"Downloaded {self.total_submissions} submissions.")

    ###########################################################
    # ONE QUESTION
    ###########################################################

    def download_question_submissions(self, slug):
        offset = 0
        last_key = None

        while True:
            response = self.fetch_page(
                slug=slug,
                offset=offset,
                last_key=last_key
            )

            submissions = response["submissions"]

            if not submissions:
                break

            self.store_submissions(submissions)

            if not response["hasNext"]:
                break

            last_key = response["lastKey"]

            offset += len(submissions)

            time.sleep(0.25)

    ###########################################################
    # FETCH PAGE
    ###########################################################

    def fetch_page(self, slug, offset, last_key):
        for attempt in range(3):
            try:
                return self.api.get_submission_page(
                    slug=slug,
                    offset=offset,
                    last_key=last_key
                )

            except Exception as e:
                print(f"Retry {attempt+1}/3")
                time.sleep(2)

        raise Exception(f"Unable to fetch submissions for {slug}")

    ###########################################################
    # STORE SUBMISSIONS
    ###########################################################

    def store_submissions(self, submissions):
        inserted = 0
        skipped = 0

        for submission in submissions:
            submission_id = submission["id"]

            if self.db.submission_exists(submission_id):
                skipped += 1
                continue

            self.db.insert_submission(submission)

            inserted += 1
            self.total_submissions += 1

            print(
                f"   + {submission['id']} "
                f"{submission['statusDisplay']} "
                f"{submission['langName']}"
            )

        if inserted:
            self.db.commit()

        if skipped:
            print(f"   Skipped {skipped} existing submissions")

    ###########################################################
    # DOWNLOAD ALL QUESTIONS
    ###########################################################

    def download_all(self):
        questions = self.db.get_all_questions()

        total = len(questions)

        print(f"\nTotal Questions : {total}\n")

        for index, (slug, title) in enumerate(questions, start=1):
            print("-" * 60)
            print(f"[{index}/{total}] {title}")

            try:
                self.download_question_submissions(slug)

            except Exception as e:
                print(f"ERROR : {slug}")
                print(e)
                continue

        print()
        print("=" * 60)
        print("Submission Download Finished")
        print(f"Total Downloaded : {self.total_submissions}")
        print("=" * 60)

    ###########################################################
    # STATISTICS
    ###########################################################

    def statistics(self):
        print()
        print(f"Questions : {self.total_questions}")
        print(f"Submissions : {self.total_submissions}")
        print()

    ###########################################################
    # RESUME SUPPORT
    ###########################################################

    def resume(self):
        print("\nResuming submission download...\n")

        self.download_all()

    ###########################################################
    # SAFE COMMIT
    ###########################################################

    def safe_commit(self):
        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

    ###########################################################
    # RUN
    ###########################################################

    def run(self):
        try:
            self.download_all()
            self.safe_commit()

        except KeyboardInterrupt:
            print("\nInterrupted by user.")
            self.safe_commit()

        except Exception as e:
            print("\nUnexpected Error")
            print(e)
            self.db.rollback()
            raise

        finally:
            print("\nSubmission synchronization complete.")