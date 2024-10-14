import { postStatusType } from '../consts/constants'

export type Post = {
  id: string
  managerId: string
  position: string
  status: postStatusType
  imageUrl: string
  isWorkingInProgress: boolean
  createdAt: Date
  publishedAt: Date
  canceledAt: Date
}
