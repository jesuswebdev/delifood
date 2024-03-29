import { Types } from 'mongoose';
import { PluginProperties } from '@hapi/hapi';
declare module '@hapi/hapi' {
  export interface PluginProperties {
    // eslint-disable-next-line
    [key: string]: any;
  }
}

export const castToObjectId = function castToObjectId(
  value: string | Types.ObjectId
) {
  if (typeof value === 'string') {
    return new Types.ObjectId(value);
  }

  return value;
};

export const cloneObject = function cloneObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
};

export const getModel = function getModel<T>(
  plugins: PluginProperties,
  model: string
): T {
  return plugins.mongoose.connection.model(model);
};

export const assertNonDuplicateIds = function assertNonDuplicateIds(
  ids: string[]
): boolean {
  const aux: { [key: string]: number } = {};

  for (const id of ids) {
    if (aux[id]) {
      return false;
    }
    aux[id] = 1;
  }

  return true;
};

export * from './interfaces/index';
export * from './schemas/index';
export * from './hapi/index';
export * from './test-helpers';
export * from './constants';
export * from './MessageBroker';
