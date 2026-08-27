import { generateKeyPairSync } from 'crypto'
import * as jwt from 'jsonwebtoken'
import axios from 'axios'
import { GithubClient } from './github'

jest.mock('axios')
const mockedPost = axios.post as jest.Mock

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const appId = '123456'
const installationId = '78901234'
const username = 'civic-support-net'
const repository = 'houfu-cf-web-frontend'

beforeEach(() => {
  mockedPost.mockReset()
})

test('dispatchWorkflow requests installation token with app JWT', async () => {
  mockedPost
    .mockResolvedValueOnce({ status: 201, data: { token: 'ghs_dummy_token' } })
    .mockResolvedValueOnce({ status: 204 })

  const client = new GithubClient(username, repository, appId, installationId, privateKey)
  await client.dispatchWorkflow('firebase-deploy-production.yml', 'main')

  const [tokenUrl, , tokenConfig] = mockedPost.mock.calls[0]
  expect(tokenUrl).toBe(`https://api.github.com/app/installations/${installationId}/access_tokens`)

  const authHeader: string = tokenConfig.headers.Authorization
  expect(authHeader).toMatch(/^Bearer /)
  const appJwt = authHeader.replace('Bearer ', '')
  const payload = jwt.verify(appJwt, publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload
  expect(payload.iss).toBe(appId)
  expect(payload.exp - payload.iat).toBeLessThanOrEqual(600)
})

test('dispatchWorkflow triggers workflow with installation token', async () => {
  mockedPost
    .mockResolvedValueOnce({ status: 201, data: { token: 'ghs_dummy_token' } })
    .mockResolvedValueOnce({ status: 204 })

  const client = new GithubClient(username, repository, appId, installationId, privateKey)
  await client.dispatchWorkflow('firebase-deploy-production.yml', 'main')

  const [dispatchUrl, dispatchBody, dispatchConfig] = mockedPost.mock.calls[1]
  expect(dispatchUrl).toBe(
    `https://api.github.com/repos/${username}/${repository}/actions/workflows/firebase-deploy-production.yml/dispatches`,
  )
  expect(dispatchBody).toMatchObject({ ref: 'main' })
  expect(dispatchConfig.headers.Authorization).toBe('token ghs_dummy_token')
})

test('dispatchWorkflow rejects when dispatch request fails', async () => {
  mockedPost
    .mockResolvedValueOnce({ status: 201, data: { token: 'ghs_dummy_token' } })
    .mockRejectedValueOnce(new Error('Request failed with status code 422'))

  const client = new GithubClient(username, repository, appId, installationId, privateKey)
  await expect(
    client.dispatchWorkflow('firebase-deploy-production.yml', 'main'),
  ).rejects.toThrow('Request failed with status code 422')
})
