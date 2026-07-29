USER_PROGRESS_QUERY = """
query userProgressQuestionList($filters: UserProgressQuestionListInput){
  userProgressQuestionList(filters:$filters){
    totalNum
    questions{
      frontendId
      title
      titleSlug
      difficulty
      lastSubmittedAt
      numSubmitted
      questionStatus
      lastResult
      topicTags{name slug}
    }
  }
}
"""

SUBMISSION_LIST_QUERY = """
query submissionList($offset:Int!,$limit:Int!,$lastKey:String,$questionSlug:String!,$lang:Int,$status:Int){
  questionSubmissionList(offset:$offset,limit:$limit,lastKey:$lastKey,questionSlug:$questionSlug,lang:$lang,status:$status){
    lastKey
    hasNext
    submissions{
      id title titleSlug status statusDisplay lang langName runtime timestamp url memory
    }
  }
}
"""

SUBMISSION_DETAILS_QUERY = """
query submissionDetails($submissionId:Int!){
 submissionDetails(submissionId:$submissionId){
   code runtime memory timestamp statusCode
   lang{name verboseName}
   question{titleSlug questionId}
 }
}
"""
