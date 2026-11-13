import { Module } from "@nestjs/common";
import { ServeCommand } from "./serve-command.js";

@Module({ providers: [ServeCommand] })
export class CliModule {}
