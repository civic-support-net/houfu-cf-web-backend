import { db } from './firestore'
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { messageStatus } from '../../consts/constants'
import moment from 'moment'
import { Manager } from '../../types/manager'
import { Message } from '../../types/message'

export const getMessageById = async (id: string) => {
  let message: Message = (
    await db.collection('messages').doc(id).withConverter<Message>(messageConverter).get()
  ).data()
  return message
}

export const getWorkingMessageByManagerId = async (id: string) => {
  let message = undefined
  ;(
    await db
      .collection('messages')
      .where('managerId', '==', id)
      .where('isWorkingInProgress', '==', true)
      .withConverter<Message>(messageConverter)
      .get()
  ).forEach((doc) => {
    message = doc.data()
  })
  return message as Message | undefined
}

export const getNonPublishedApprovedMessages = async () => {
  let messages = (
    await db
      .collection('messages')
      .where('status', '==', messageStatus.APPROVED)
      .where('publishedAt', '==', null)
      .withConverter<Message>(messageConverter)
      .get()
  ).docs.map((doc) => doc.data())

  return messages
}

const messageConverter = {
  toFirestore(message: Message): DocumentData {
    return {
      id: message.id,
      managerId: message.managerId,
      position: message.position,
      status: message.status,
      imageUrl: message.imageUrl,
      isWorkingInProgress: message.isWorkingInProgress,
      createdAt: message.createdAt,
      approvedAt: message.approvedAt,
      canceledAt: message.canceledAt,
      publishedAt: message.publishedAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Message {
    const data = snapshot.data()!
    return {
      id: data.id,
      managerId: data.managerId,
      position: data.position,
      status: data.status,
      imageUrl: data.imageUrl,
      isWorkingInProgress: data.isWorkingInProgress,
      createdAt: data.createdAt.toDate(),
      approvedAt: data.approvedAt ? data.approvedAt.toDate() : null,
      canceledAt: data.canceledAt ? data.canceledAt.toDate() : null,
      publishedAt: data.publishedAt ? data.publishedAt.toDate() : null,
    }
  },
}

export const createMessage = async (manager: Manager) => {
  const newMessage: Message = {
    id: `${moment().utcOffset(9).format('YYMMDD-hhmmss')}`,
    managerId: manager.id,
    position: '',
    status: messageStatus.INPUT_IMAGE,
    imageUrl: '',
    isWorkingInProgress: true,
    createdAt: moment().utcOffset(9).toDate(),
    approvedAt: null,
    canceledAt: null,
    publishedAt: null,
  }
  updateMessage(newMessage)
  console.info(`create new message${newMessage}`)
  return newMessage
}
export const updateMessage = async (message: Message) => {
  await db.collection('messages').doc(message.id).set(message)
}

export const deleteMessage = async (message: Message) => {
  await db.collection('messages').doc(message.id).delete()
}
