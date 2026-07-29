import sys

from config import DATABASE
from database import Database

from sync_questions import QuestionSync
from sync_submission import SubmissionSync
from sync_code import CodeSync


class Exporter:
    def __init__(self):
        self.db = Database(DATABASE)

    ############################################################
    # Download Everything
    ############################################################
    def sync(self):
        print("=" * 60)
        print("LeetCode Downloader")
        print("=" * 60)

        print("\nSTEP 1 : Download Questions\n")
        QuestionSync(self.db).run()

        print("\nSTEP 2 : Download Submission Lists\n")
        SubmissionSync(self.db).run()

        print("\nSTEP 3 : Download Source Code\n")
        CodeSync(self.db).run()

        print("\nDownload Finished!")

    ############################################################
    # Individual Downloaders
    ############################################################
    def sync_questions(self):
        QuestionSync(self.db).run()

    def sync_submissions(self):
        SubmissionSync(self.db).run()

    def sync_code(self):
        CodeSync(self.db).run()

    ############################################################
    # Close Database
    ############################################################
    def close(self):
        self.db.close()


def main():
    exporter = Exporter()

    try:
        if len(sys.argv) == 1:
            exporter.sync()

        else:
            command = sys.argv[1].lower()

            if command == "sync":
                exporter.sync()

            elif command == "questions":
                exporter.sync_questions()

            elif command == "submissions":
                exporter.sync_submissions()

            elif command == "code":
                exporter.sync_code()

            else:
                print("Unknown command.")
                print()
                print("Usage:")
                print("python exporter.py")
                print("python exporter.py sync")
                print("python exporter.py questions")
                print("python exporter.py submissions")
                print("python exporter.py code")

    finally:
        exporter.close()


if __name__ == "__main__":
    main()