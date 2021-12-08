import bcrypt from 'bcrypt';

export class Password {
  static async hash(str: string) {
    return await bcrypt.hash(str, 10);
  }
  static async compare(currentPasswordHash: string, toCompare: string) {
    return await bcrypt.compare(toCompare, currentPasswordHash);
  }
}
