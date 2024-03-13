import { config } from "dotenv";
config();

export default function envVar(variable: string): string {
  const envVar = process.env[variable];
  if (!envVar) throw new Error("no such environment variable exist!");
  return envVar;
}
