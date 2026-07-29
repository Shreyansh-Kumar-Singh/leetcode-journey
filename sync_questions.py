from api import LeetCodeAPI
from database import Database


class QuestionSync:

    def __init__(self, db: Database):

        self.api = LeetCodeAPI()

        self.db = db

    def download_all_questions(self):

        print("\nDownloading Questions...\n")

        skip = 0

        total = None

        downloaded = 0

        while True:

            response = self.api.get_questions(
                skip=skip
            )

            if total is None:

                total = response["totalNum"]

                print(f"Total Questions : {total}\n")

            questions = response["questions"]

            if not questions:

                break

            for question in questions:

                downloaded += 1

                print(
                    f"[{downloaded}/{total}] "
                    f"{question['title']}"
                )

                self.db.insert_question(question)

            self.db.commit()

            skip += len(questions)

            if downloaded >= total:

                break

        print("\nQuestions Downloaded Successfully.\n")

        return downloaded

    def sync(self):

        try:

            return self.download_all_questions()

        except KeyboardInterrupt:

            print("\nStopped by user.")

            self.db.commit()

            raise

        except Exception as e:

            self.db.rollback()

            raise e

    # Alias so callers (e.g. exporter.py) can use QuestionSync(db).run(),
    # consistent with CodeSync's run() method.
    def run(self):

        return self.sync()