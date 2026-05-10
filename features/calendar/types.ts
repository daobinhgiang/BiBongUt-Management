import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type CalendarEvent = Tables["calendar_events"]["Row"];
export type CalendarEventInsert = Tables["calendar_events"]["Insert"];
export type CalendarEventUpdate = Tables["calendar_events"]["Update"];

export type AttendanceStatus = Enums["attendance_status"];

export type EventWithAttendees = CalendarEvent & {
  creator: { id: string; nickname: string };
  event_attendees: {
    id: string;
    event_id: string;
    family_member_id: string;
    status: AttendanceStatus;
    family_member: { id: string; nickname: string };
  }[];
};
