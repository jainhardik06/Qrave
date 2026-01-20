import { AsyncLocalStorage } from 'async_hooks';
import { Types } from 'mongoose';

type StoreShape = {
  tenantId?: Types.ObjectId | string;
  userId?: string;
  email?: string;
  roles?: string[];
  token?: string;
};

// Small helper to carry request-scoped values such as tenant id
class RequestContextHost {
  private static storage = new AsyncLocalStorage<StoreShape>();

  static run<T>(callback: () => T): T {
    return RequestContextHost.storage.run({}, callback);
  }

  static set(data: Partial<StoreShape>) {
    const store = RequestContextHost.storage.getStore();
    if (store) {
      Object.assign(store, data);
    }
  }

  static getTenantId(): Types.ObjectId | string | undefined {
    return RequestContextHost.storage.getStore()?.tenantId;
  }

  static getUserId(): string | undefined {
    return RequestContextHost.storage.getStore()?.userId;
  }

  static getUser() {
    const store = RequestContextHost.storage.getStore();
    return {
      userId: store?.userId,
      email: store?.email,
      roles: store?.roles,
    };
  }
}

export const RequestContext = RequestContextHost;
