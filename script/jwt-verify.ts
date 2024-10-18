import jwt from 'jsonwebtoken'

// tokenを第一引数に、シークレットキーを第二引数にして実行する
if (process.argv.length !== 4) {
  console.error('Usage: ts-node jwt-gen.ts <username> <secret>')
  process.exit(1)
}

const token = process.argv[2]
const secret = process.argv[3]

jwt.verify(token, secret, (err, decoded) => {
  if (err) {
    console.error('Token is invalid:', err)
  } else {
    console.log('Decoded Payload:', decoded)
  }
})
