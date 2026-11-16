import { Injectable } from "@nestjs/common";
import pLimit from "p-limit";

@Injectable()
export class SessionQueue {
  private readonly limit = pLimit(2);

  run(task: () => Promise<void>): Promise<void> {
    return this.limit(task);
  }

  setConcurrency(value: number): void {
    this.limit.concurrency = value;
  }
}
