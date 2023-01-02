export type CalendarData = {
  calendarId: string
  dangerZoneEvents: Array<{
    periodId: string
    eventId: string
  }>
  nextPeriodEvents?: Array<{
    periodId: string
    eventId: string
  }>
}
