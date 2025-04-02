import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { JSONSchema7 } from 'json-schema'
import { parse } from 'valibot'
import type { GenerateReviewPayload } from '../../types'
import { reviewSchema } from './reviewSchema'

export const SYSTEM_PROMPT = `You are a database design expert tasked with reviewing database schema changes. Analyze the provided context, pull request information, and file changes carefully, and respond strictly in the provided JSON schema format.

When analyzing the changes, consider:
1. The pull request description, which often contains the rationale behind changes and domain-specific information
2. The pull request comments, which may include discussions and additional context
3. The documentation context and schema files to understand the existing system
4. The file changes to identify potential issues and improvements

Your JSON-formatted response must contain:

- An array of identified issues in the "issues" field, each including:
  - "kind": The issue category, selected from:
    - Migration Safety
    - Data Integrity
    - Performance Impact
    - Project Rules Consistency
    - Security or Scalability
  - "severity": "high", "medium", or "low" depending on impact.
  - "description": A clear and precise explanation of the issue.
  - "suggestion": Actionable recommendations for addressing the issue.
- An array of scores for each issue kind in the "scores" field, each including:
  - "kind": One of the issue categories listed above.
  - "value": A numeric score from 0 to 10, with 10 being the highest.
  - "reason": An explanation justifying the score provided.
- A brief summary of the review in the "summary" field.
- A detailed and constructive overall review in the "bodyMarkdown" field.
  - The bodyMarkdown should be a markdown formatted string.

Ensure your response strictly adheres to the provided JSON schema.
**Your output must be raw JSON only. Do not include any markdown code blocks or extraneous formatting.**
`

export const USER_PROMPT = `Pull Request Description:
{prDescription}

Pull Request Comments:
{prComments}

Documentation Context:
{docsContent}

Schema Files:
{schemaFiles}

File Changes:
{fileChanges}`

export const reviewJsonSchema: JSONSchema7 = toJsonSchema(reviewSchema)

export const generateReview = async (
  docsContent: string,
  schemaFiles: GenerateReviewPayload['schemaFiles'],
  fileChanges: GenerateReviewPayload['fileChanges'],
  prDescription: string,
  prComments: string,
  callbacks: Callbacks,
) => {
  const chatPrompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    ['human', USER_PROMPT],
  ])

  const model = new ChatOpenAI({
    temperature: 0.7,
    model: 'gpt-4o-mini',
  })

  const chain = chatPrompt.pipe(model.withStructuredOutput(reviewJsonSchema))
  const response = await chain.invoke(
    {
      docsContent,
      schemaFiles,
      fileChanges,
      prDescription,
      prComments,
    },
    {
      callbacks,
    },
  )
  const parsedResponse = parse(reviewSchema, response)
  return parsedResponse
}
