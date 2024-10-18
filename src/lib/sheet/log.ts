import { insertRow } from './insert'

export const insertLog = async (
  dateString: string,
  user: string,
  action: string,
  target: string,
) => {
  insertRow(1, [dateString, user, action, target])
}
