import { Post } from '../../types/post'

export const postSummary = (post: Post) => {
  return `${post.id}_${post.managerId}`
}
