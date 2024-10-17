import { Manager } from '../../types/manager'
import { Message } from '../../types/message'

export const managerSummary = (manager: Manager) => {
  return `${manager.id}_${manager.name}`
}

export const messageSummary = (message: Message) => {
  return `${message.id}_${message.managerId}`
}
