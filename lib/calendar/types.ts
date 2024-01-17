export type CalendarData = {
  calendarId: string
  dangerZoneEvents: Array<{
    periodId: string
    eventId: string
    ovulationId?: string
  }>
  nextPeriodEvents?: Array<{
    periodId: string
    eventId: string
  }>
}
