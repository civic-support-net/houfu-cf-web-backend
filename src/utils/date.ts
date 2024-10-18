import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const jstDateString = (date: Date): string => {
  const now = new Date()
  const jstDate = toZonedTime(now, 'Asia/Tokyo')
  const jstDateStr = format(jstDate, 'yyMMdd-HHmmss')
  return jstDateStr
}
