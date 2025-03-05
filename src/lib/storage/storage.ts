import { Bucket } from '@google-cloud/storage'
import admin from 'firebase-admin'
import { loadConfig } from '../../config/config'

export var db: admin.storage.Storage | undefined
export var bucket: Bucket

export const newStorage = () => {
  if (db === undefined) {
    db = admin.storage()
    let conf = loadConfig()
    bucket = db.bucket(`gs://${conf.bucketName}`)
  }
}

export const upload = async (data: Buffer, path: string) => {
  await bucket.file(path).save(data)
}

export const GetUrl = (path: string) => {
  let conf = loadConfig()
  return `https://storage.googleapis.com/${conf.bucketName}/${encodeURIComponent(path)}`
}
