import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { RequestContext } from '../../common/context/request-context';

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(Order.name) private readonly orderModel: Model<Order>) {}

  async getSummary(days = 7) {
    const tenantId = RequestContext.getTenantId();
    const match: Record<string, any> = {};
    if (tenantId) {
      match.tenant_id = new Types.ObjectId(tenantId as any);
    }
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: startDate };

    const [result] = await this.orderModel.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                ordersCount: { $sum: 1 },
                revenue: { $sum: '$total_amount' },
              },
            },
          ],
          pending: [
            { $match: { status: { $in: ['QUEUED', 'PREPARING'] } } },
            { $count: 'pending' },
          ],
          topItem: [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.dish_id',
                qty: { $sum: '$items.quantity' },
              },
            },
            { $sort: { qty: -1 } },
            { $limit: 1 },
          ],
        },
      },
    ]);

    const totals = result?.totals?.[0] || { ordersCount: 0, revenue: 0 };
    const pending = result?.pending?.[0]?.pending ?? 0;
    const topItemId = result?.topItem?.[0]?._id;

    return {
      ordersToday: totals.ordersCount ?? 0,
      revenueToday: totals.revenue ?? 0,
      pending,
      topItem: topItemId ?? null,
    };
  }

  async getTopItems(days = 30, limit = 5) {
    const tenantId = RequestContext.getTenantId();
    const match: Record<string, any> = {};
    if (tenantId) {
      match.tenant_id = new Types.ObjectId(tenantId as any);
    }
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: startDate };

    const rows = await this.orderModel.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.dish_id',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: limit },
    ]);

    return rows.map((r) => ({
      dish_id: r._id,
      quantity: r.quantity,
      revenue: r.revenue,
    }));
  }
}
