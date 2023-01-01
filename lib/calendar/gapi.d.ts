type ResponseWithResult<TResult> = {
  result: TResult
  body: string
  headers: Record<string, string>
  status: number
  statusText: string | null
}

type InsertCalendar = (input: { summary: string }) => PromiseLike<
  ResponseWithResult<{
    kind: 'calendar#calendar'
    etag: string
    id: string
    summary: string
    timeZone: string
    conferenceProperties: {
      allowedConferenceSolutionTypes: string[]
    }
  }>
>

type InsertEvent = (input: {
  calendarId: string
  resource: {
    summary: string
    start: {
      dateTime: string
      timeZone: string
    }
    end: {
      dateTime: string
      timeZone: string
    }
  }
}) => Promise<
  ResponseWithResult<{
    kind: 'calendar#event'
    etag: string
    id: string
    status: string
    htmlLink: string
    created: string
    updated: string
    summary: string
    creator: {
      email: string
    }
    organizer: {
      email: string
      displayName: string
      self: boolean
    }
    start: {
      dateTime: string
      timeZone: string
    }
    end: {
      dateTime: string
      timeZone: string
    }
    iCalUID: string
    sequence: number
    reminders: {
      useDefault: boolean
    }
    eventType: string
  }>
>

declare namespace gapi.client {
  export function load(url: string): Promise<void>

  export const calendar = {
    calendars: {
      insert: InsertCalendar,
    },
    events: {
      insert: InsertEvent,
    },
  }
}
