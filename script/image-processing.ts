import sharp from 'sharp'
import path from 'path'

const IMAGE_WIDTH = 800
const IMAGE_HEIGHT = 480
const threshold = 128

async function processImage(inputPath: string, outputPath: string) {
  try {
    // 入力画像を読み込む
    const inputBuffer = await sharp(inputPath).toBuffer()

    let image = sharp(inputBuffer)
      .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .grayscale()
      .modulate({ brightness: 1.2 })
      .gamma(1.5)
    // .sharpen()これすると真っ黒になる

    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })

    const rgbaData = Buffer.alloc(info.width * info.height * 4)
    for (let i = 0; i < info.width * info.height; i++) {
      const grayValue = data[i]
      const binaryValue = grayValue > threshold ? 255 : 0
      rgbaData[i * 4] = binaryValue
      rgbaData[i * 4 + 1] = binaryValue
      rgbaData[i * 4 + 2] = binaryValue
      rgbaData[i * 4 + 3] = grayValue > threshold ? 0 : 255
    }

    await sharp(rgbaData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toFile(outputPath)

    console.log('画像処理が完了しました。')
    console.log(`出力ファイル: ${outputPath}`)
  } catch (error) {
    console.error('エラーが発生しました:', error)
    process.exit(1)
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2)
if (args.length !== 2) {
  console.log('使用方法: ts-node script/image-processing.ts <入力ファイル> <出力ファイル>')
  process.exit(1)
}

const [inputPath, outputPath] = args
processImage(inputPath, outputPath)
