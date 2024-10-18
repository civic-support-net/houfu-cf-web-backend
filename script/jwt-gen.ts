import jwt from 'jsonwebtoken'

// usernameを第一引数に、シークレットキーを第二引数にして実行する
if (process.argv.length !== 4) {
  console.error('Usage: ts-node jwt-gen.ts <username> <secret>')
  process.exit(1)
}

const username = process.argv[2]
const secret = process.argv[3]

const payload = {
  username,
}

const token = jwt.sign(payload, secret)
console.log('Generated Token:', token)
