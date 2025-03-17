import { bucket, upload } from './storage'
import { Message } from '../../types/message'

export const deleteMessageData = async (path: string) => {
  await bucket.file(path).delete()
}

export const uploadImage = async (image: Buffer, path: string) => {
  await upload(image, path)
  bucket.file(path).makePublic()
}
