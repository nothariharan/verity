import type { EventLog } from "../log/event-log";
import { Session, type SessionBrain } from "./session";

export class SessionHub {
  private live = new Map<string, Promise<Session>>();

  constructor(
    readonly log: EventLog,
    private brain: SessionBrain | null,
  ) {}

  get(id: string): Promise<Session> {
    let s = this.live.get(id);
    if (!s) {
      s = Session.load(id, this.log, this.brain);
      this.live.set(id, s);
    }
    return s;
  }
}
