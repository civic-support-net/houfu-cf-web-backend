export type Config = {
  projectId: string
  bucketName: string
  logSheetId: string
  managerLineSecret: string
  managerLineAccessToken: string
  githubUsername: string
  githubRepository: string
  githubYaml: string
  githubBranch: string
  githubAppId: string
  githubAppInstallationId: string
  githubAppPrivateKey: string
  jwtSecret: string
  frontendUrl: string
}

var config: Config | undefined

export const loadConfig = (): Config => {
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'development') {
    require('dotenv').config()
  }

  if (!config) {
    config = {
      projectId: process.env.PROJECT_ID,
      bucketName: process.env.BUCKET_NAME,
      logSheetId: process.env.LOG_SHEET_ID,
      managerLineSecret: process.env.MANAGER_LINE_SECRET,
      managerLineAccessToken: process.env.MANAGER_LINE_TOKEN,
      githubUsername: process.env.GITHUB_USERNAME,
      githubRepository: process.env.GITHUB_REPOSITORY,
      githubYaml: process.env.GITHUB_YAML,
      githubBranch: process.env.GITHUB_BRANCH,
      githubAppId: process.env.GITHUB_APP_ID,
      githubAppInstallationId: process.env.GITHUB_APP_INSTALLATION_ID,
      // PEM形式の秘密鍵をbase64エンコードして環境変数に設定する
      githubAppPrivateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY ?? '', 'base64').toString(
        'utf8',
      ),
      jwtSecret: process.env.JWT_SECRET,
      frontendUrl: process.env.FRONTEND_URL,
    }
  }

  return config
}
