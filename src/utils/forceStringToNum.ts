export default function forceStringToNum(value: string): number {
  const converted = Number(value);
  if (isNaN(converted)) {
    throw new Error(`provided string ${value} cannot be converted to a number`);
  }
  return converted;
}
