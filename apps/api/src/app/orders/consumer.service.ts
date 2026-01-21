import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Consumer } from '../../schemas/consumer.schema';
import { RequestContext } from '../../common/context/request-context';

export interface ConsumerInput {
  phone: string;
  name: string;
  email?: string;
}

@Injectable()
export class ConsumerService {
  constructor(@InjectModel(Consumer.name) private consumerModel: Model<Consumer>) {}

  /**
   * Find or create a consumer by phone number
   * - Phone is the primary identifier within a tenant
   * - If consumer exists but name changed, update the name
   * - Returns existing or newly created consumer
   */
  async findOrCreate(input: ConsumerInput): Promise<Consumer> {
    const tenant_id = RequestContext.getTenantId();
    if (!tenant_id) {
      throw new Error('Tenant ID is required');
    }

    const { phone, name, email } = input;

    // Find existing consumer by phone + tenant
    let consumer = await this.consumerModel.findOne({ tenant_id, phone }).exec();

    if (consumer) {
      // Consumer exists - update name and email if changed
      let hasChanges = false;

      if (consumer.name !== name) {
        consumer.name = name;
        hasChanges = true;
      }

      if (email && consumer.email !== email) {
        consumer.email = email;
        hasChanges = true;
      }

      if (hasChanges) {
        await consumer.save();
      }

      return consumer;
    }

    // Create new consumer
    consumer = await this.consumerModel.create({
      tenant_id,
      phone,
      name,
      email,
      first_order_at: new Date(),
    });

    return consumer;
  }

  /**
   * Update consumer stats after order placement
   */
  async updateOrderStats(consumerId: string, orderAmount: number): Promise<void> {
    await this.consumerModel.findByIdAndUpdate(consumerId, {
      $inc: { total_orders: 1, total_spent: orderAmount },
      last_order_at: new Date(),
    });
  }

  /**
   * Add or update address in consumer's address history
   */
  async updateAddress(
    consumerId: string,
    address: {
      address_line?: string;
      area?: string;
      landmark?: string;
      coordinates?: { latitude: number; longitude: number };
    },
  ): Promise<void> {
    const consumer = await this.consumerModel.findById(consumerId);
    if (!consumer) return;

    // Check if similar address exists
    const existingIndex = consumer.addresses.findIndex(
      (addr) => addr.area === address.area && addr.address_line === address.address_line,
    );

    if (existingIndex >= 0) {
      // Update existing address
      consumer.addresses[existingIndex] = {
        ...address,
        last_used_at: new Date(),
      };
    } else {
      // Add new address
      consumer.addresses.push({
        ...address,
        last_used_at: new Date(),
      });
    }

    await consumer.save();
  }

  /**
   * Get consumer by ID
   */
  async findById(id: string): Promise<Consumer | null> {
    return this.consumerModel.findById(id).exec();
  }

  /**
   * Get consumer by phone for a tenant
   */
  async findByPhone(phone: string): Promise<Consumer | null> {
    const tenant_id = RequestContext.getTenantId();
    if (!tenant_id) return null;

    return this.consumerModel.findOne({ tenant_id, phone }).exec();
  }

  /**
   * Get all consumers for a tenant (for CRM)
   */
  async findAll(filters?: { search?: string; limit?: number; skip?: number }): Promise<Consumer[]> {
    const tenant_id = RequestContext.getTenantId();
    if (!tenant_id) return [];

    const query: any = { tenant_id, is_active: true };

    if (filters?.search) {
      query.$or = [{ name: { $regex: filters.search, $options: 'i' } }, { phone: { $regex: filters.search, $options: 'i' } }];
    }

    return this.consumerModel
      .find(query)
      .sort({ last_order_at: -1 })
      .limit(filters?.limit || 100)
      .skip(filters?.skip || 0)
      .exec();
  }
}
