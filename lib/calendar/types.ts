export type CalendarData = {
  calendarId: string
  dangerZoneEvents: Array<{
    eventId: string
    periodId?: string
    ovulationId?: string
  }>
  nextPeriodEvents?: Array<{
    periodId: string
    eventId: string
  }>
}
