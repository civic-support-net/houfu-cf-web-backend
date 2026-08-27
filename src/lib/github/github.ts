import axios from 'axios'
import * as jwt from 'jsonwebtoken'
import { loadConfig } from '../../config/config'

export var gh: GithubClient | undefined

export const newGithub = () => {
  if (gh === undefined) {
    let conf = loadConfig()
    gh = new GithubClient(
      conf.githubUsername,
      conf.githubRepository,
      conf.githubAppId,
      conf.githubAppInstallationId,
      conf.githubAppPrivateKey,
    )
  }
}

export const deploy = async () => {
  let conf = loadConfig()
  await gh.dispatchWorkflow(conf.githubYaml, conf.githubBranch)
}

const headers = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'githubapi',
}

export class GithubClient {
  private username: string
  private repository: string
  private appId: string
  private installationId: string
  private privateKey: string

  constructor(
    username: string,
    repository: string,
    appId: string,
    installationId: string,
    privateKey: string,
  ) {
    this.username = username
    this.repository = repository
    this.appId = appId
    this.installationId = installationId
    this.privateKey = privateKey
  }

  public async dispatchWorkflow(yml: string, branch: string): Promise<void> {
    const token = await this.getInstallationToken()
    await axios.post(
      `https://api.github.com/repos/${this.username}/${this.repository}/actions/workflows/${yml}/dispatches`,
      { ref: branch },
      { headers: { ...headers, Authorization: `token ${token}` } },
    )
  }

  private async getInstallationToken(): Promise<string> {
    const res = await axios.post(
      `https://api.github.com/app/installations/${this.installationId}/access_tokens`,
      {},
      { headers: { ...headers, Authorization: `Bearer ${this.generateAppJwt()}` } },
    )
    return res.data.token
  }

  private generateAppJwt(): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      // 時計のずれを許容するため60秒過去にする
      iat: now - 60,
      exp: now + 540,
      iss: this.appId,
    }
    return jwt.sign(payload, this.privateKey, { algorithm: 'RS256' })
  }
}
