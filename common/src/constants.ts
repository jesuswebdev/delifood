export enum AUTH_STRATEGY {
  TOKEN_AUTH = 'TOKEN_AUTH'
}

export enum USER_STATUS {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  BANNED = 'BANNED'
}

export enum PRODUCT_STATUS {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  PAUSED = 'PAUSED'
}

export enum EXCHANGE_TYPES {
  USER_EVENTS = 'USER_EVENTS',
  PRODUCT_EVENTS = 'PRODUCT_EVENTS'
}

export enum USER_EVENTS {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted'
}

export enum PRODUCT_EVENTS {
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted'
}
