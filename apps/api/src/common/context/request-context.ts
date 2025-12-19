import { AsyncLocalStorage } from 'async_hooks';
import { Types } from 'mongoose';

type StoreShape = {
  tenantId?: Types.ObjectId | string;
  userId?: string;
  email?: string;
  roles?: string[];
  token?: string;
};

// Small helper to carry request-scoped values such as tenant id using AsyncLocalStorage.
class RequestContextHost {
  private readonly storage = new AsyncLocalStorage<StoreShape>();

  run(callback: () => void) {
    this.storage.run({}, callback);
  }

  get store(): StoreShape | undefined {
    return this.storage.getStore();
  }

  setTenantId(tenantId?: Types.ObjectId | string) {
    const store = this.storage.getStore();
    if (store) {
      store.tenantId = tenantId;
    }
  }

  setUser(payload: Partial<Pick<StoreShape, 'userId' | 'email' | 'roles' | 'token'>>) {
    const store = this.storage.getStore();
    if (store) {
      store.userId = payload.userId ?? store.userId;
      store.email = payload.email ?? store.email;
      store.roles = payload.roles ?? store.roles;
      store.token = payload.token ?? store.token;
    }
  }

  getTenantId() {
    return this.storage.getStore()?.tenantId;
  }
}

export const RequestContext = new RequestContextHost();
