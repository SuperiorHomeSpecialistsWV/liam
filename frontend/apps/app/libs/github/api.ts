import crypto from 'node:crypto'
import type { FileChange } from '@/types/github'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'

const createOctokit = async (installationId: number) => {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      installationId,
    },
  })

  return octokit
}

export const getPullRequestDetails = async (
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
) => {
  const octokit = await createOctokit(installationId)

  const { data: pullRequest } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  })

  return pullRequest
}

export const getPullRequestFiles = async (
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<FileChange[]> => {
  const octokit = await createOctokit(installationId)

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  })

  return files.map(
    (file: {
      filename: string
      status:
        | 'added'
        | 'removed'
        | 'modified'
        | 'renamed'
        | 'copied'
        | 'changed'
        | 'unchanged'
      additions: number
      deletions: number
      changes: number
      patch?: string | undefined
    }) => {
      const extension = file.filename.split('.').pop() || 'unknown'

      return {
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        fileType: extension,
        patch: file.patch || '',
      }
    },
  )
}

export const createPullRequestComment = async (
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
) => {
  const octokit = await createOctokit(installationId)

  const response = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  })

  return response.data
}

export const updatePullRequestComment = async (
  installationId: number,
  owner: string,
  repo: string,
  commentId: number,
  body: string,
) => {
  const octokit = await createOctokit(installationId)

  const response = await octokit.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body,
  })

  return response.data
}

export const verifyWebhookSignature = (
  payload: string,
  signature: string,
): boolean => {
  const hmac = crypto.createHmac(
    'sha256',
    process.env.GITHUB_WEBHOOK_SECRET || '',
  )
  const digest = `sha256=${hmac.update(payload).digest('hex')}`

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}
