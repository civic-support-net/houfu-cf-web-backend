import { db } from './firestore'
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { postStatus } from '../../consts/constants'
import { Post } from '../../types/post'
import moment from 'moment'
import { Manager } from '../../types/managers'

export const GetPostById = async (id: string) => {
  let post: Post = (
    await db.collection('posts').doc(id).withConverter<Post>(postConverter).get()
  ).data()
  return post
}

export const getWorkingPostByManagerId = async (id: string) => {
  let post = undefined
  ;(
    await db
      .collection('posts')
      .where('managerId', '==', id)
      .where('isWorkingInProgress', '==', true)
      .withConverter<Post>(postConverter)
      .get()
  ).forEach((doc) => {
    post = doc.data()
  })
  return post as Post | undefined
}

export const getWorkingPostByRejectedManagerId = async (id: string) => {
  let post = undefined
  ;(
    await db
      .collection('posts')
      .where('rejectedManagerId', '==', id)
      .where('isRecipientWorking', '==', true)
      .withConverter<Post>(postConverter)
      .get()
  ).forEach((doc) => {
    post = doc.data()
  })
  return post as Post | undefined
}

export const getJustPublishedPosts = async () => {
  let posts = (
    await db
      .collection('posts')
      .where('status', '==', postStatus.APPROVED)
      .where('publishedAt', '==', null)
      .withConverter<Post>(postConverter)
      .get()
  ).docs.map((doc) => doc.data())

  return posts
}

const postConverter = {
  toFirestore(post: Post): DocumentData {
    return {
      id: post.id,
      managerId: post.managerId,
      position: post.position,
      status: post.status,
      imageUrl: post.imageUrl,
      isWorkingInProgress: post.isWorkingInProgress,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      canceledAt: post.canceledAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Post {
    const data = snapshot.data()!
    return {
      id: data.id,
      managerId: data.managerId,
      position: data.position,
      status: data.status,
      imageUrl: data.imageUrl,
      isWorkingInProgress: data.isWorkingInProgress,
      createdAt: data.createdAt.toDate(),
      publishedAt: data.publishedAt ? data.publishedAt.toDate() : null,
      canceledAt: data.canceledAt ? data.canceledAt.toDate() : null,
    }
  },
}

export const createPost = async (manager: Manager, position: string) => {
  const newPost: Post = {
    id: `${moment().utcOffset(9).format('YYMMDD-hhmmss')}`,
    managerId: manager.id,
    position: position,
    status: postStatus.INPUT_IMAGE,
    imageUrl: '',
    isWorkingInProgress: true,
    createdAt: moment().utcOffset(9).toDate(),
    publishedAt: null,
    canceledAt: null,
  }
  updatePost(newPost)
  console.info(`create new post${newPost}`)
  return newPost
}
export const updatePost = async (post: Post) => {
  await db.collection('posts').doc(post.id).set(post)
}

export const deletePost = async (post: Post) => {
  await db.collection('posts').doc(post.id).delete()
}
