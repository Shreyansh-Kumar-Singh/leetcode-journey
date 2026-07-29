import requests
from config import Config
from queries import USER_PROGRESS_QUERY,SUBMISSION_LIST_QUERY,SUBMISSION_DETAILS_QUERY

class LeetCodeAPI:
    def __init__(self):
        self.s=requests.Session()
        self.s.headers.update(Config.HEADERS)
        self.s.cookies.update(Config.COOKIES)

    def graphql(self,query,variables,operation):
        r=self.s.post(Config.GRAPHQL_URL,json={
            'query':query,
            'variables':variables,
            'operationName':operation
        },timeout=Config.REQUEST_TIMEOUT)
        r.raise_for_status()
        data=r.json()
        if 'errors' in data:
            raise RuntimeError(data['errors'])
        return data['data']

    def get_questions(self,skip=0,limit=None):
        if limit is None: limit=Config.PAGE_SIZE
        return self.graphql(USER_PROGRESS_QUERY,{
            'filters':{'skip':skip,'limit':limit}
        },'userProgressQuestionList')['userProgressQuestionList']

    def get_submission_page(self,slug,last_key=None,offset=0,limit=20):
        return self.graphql(SUBMISSION_LIST_QUERY,{
            'offset':offset,'limit':limit,'lastKey':last_key,
            'questionSlug':slug
        },'submissionList')['questionSubmissionList']

    def get_submission_details(self,submission_id):
        return self.graphql(SUBMISSION_DETAILS_QUERY,{
            'submissionId':int(submission_id)
        },'submissionDetails')['submissionDetails']
