import sharp from 'sharp'
import fs from 'fs'

async function processImageBuffer(inputBuffer: Buffer, outputPath: string): Promise<void> {
  try {
    const resizeMaxSide = 680 // 画像サイズの最大辺
    const thresholdColor = 100 // 2値化閾値
    const thresholdAlpha = 200 // 2値化閾値

    // 画像を読み込み、アルファチャンネルを確保
    const image = sharp(inputBuffer)
      .grayscale()
      .threshold(thresholdColor)
      .toColorspace('b-w')
      .resize({ width: resizeMaxSide, height: resizeMaxSide, fit: sharp.fit.inside })
      .ensureAlpha()

    // アルファチャンネル用のマスクを作成（2値化して反転）
    const alphaChannel = await sharp(inputBuffer)
      .grayscale()
      .threshold(thresholdAlpha)
      .toColourspace('b-w')
      .resize({ width: resizeMaxSide, height: resizeMaxSide, fit: sharp.fit.inside })
      .negate()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data: alphaData, info: alphaInfo } = alphaChannel

    // 新しいアルファチャンネルをRGB画像に結合
    await image
      .joinChannel(alphaData, {
        raw: { width: alphaInfo.width, height: alphaInfo.height, channels: 1 },
      })
      .png()
      .toFile(outputPath)

    console.log('画像の処理が完了しました。')
  } catch (error) {
    console.error('エラーが発生しました：', (error as Error).message)
  }
}

// コマンドライン引数から入力・出力パスを取得
const args = process.argv.slice(2)
const inputPath = args[0]
const outputPath = args[1] || 'output.png'
fs.readFile(inputPath, (err, data) => {
  if (err) {
    console.error('ファイルの読み込みに失敗しました：', err.message)
    return
  }
  processImageBuffer(data, outputPath)
})
