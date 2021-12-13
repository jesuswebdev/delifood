import bcrypt from 'bcrypt';

export class Password {
  static hash(str: string) {
    return bcrypt.hash(str, 10);
  }
  static compare(currentPasswordHash: string, toCompare: string) {
    return bcrypt.compare(toCompare, currentPasswordHash);
  }
}
