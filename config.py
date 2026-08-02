import os
from dotenv import load_dotenv

load_dotenv()

GRAPHQL_URL = "https://leetcode.com/graphql/"

LEETCODE_SESSION = os.getenv("LEETCODE_SESSION")
CSRFTOKEN = os.getenv("CSRFTOKEN")
USERNAME = os.getenv("LEETCODE_USERNAME")

DATABASE = os.getenv("DATABASE", "output/leetcode.db")

PAGE_SIZE = int(os.getenv("PAGE_SIZE", "50"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
RETRY_COUNT = int(os.getenv("RETRY_COUNT", "3"))

HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com/",
    "x-csrftoken": CSRFTOKEN,
}

COOKIES = {
    "LEETCODE_SESSION": LEETCODE_SESSION,
    "csrftoken": CSRFTOKEN,
}


class Config:
    GRAPHQL_URL = GRAPHQL_URL

    LEETCODE_SESSION = LEETCODE_SESSION
    CSRFTOKEN = CSRFTOKEN
    USERNAME = USERNAME

    DATABASE = DATABASE

    PAGE_SIZE = PAGE_SIZE
    REQUEST_TIMEOUT = REQUEST_TIMEOUT
    RETRY_COUNT = RETRY_COUNT

    HEADERS = HEADERS
    COOKIES = COOKIES