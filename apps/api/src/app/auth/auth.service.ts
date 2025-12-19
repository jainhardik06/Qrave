import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../schemas/user.schema';
import { Tenant } from '../../schemas/tenant.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: { businessName: string; email: string; password: string }) {
    const newTenant = new this.tenantModel({
      name: dto.businessName,
      subdomain: dto.businessName.toLowerCase().replace(/\s+/g, '-'),
      subscription_status: 'TRIAL',
    });
    const savedTenant = await newTenant.save();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = new this.userModel({
      email: dto.email,
      password_hash: hashedPassword,
      role: 'OWNER',
      roles: ['OWNER'],
      tenant_id: savedTenant._id,
    });
    await newUser.save();

    return this.generateToken(newUser, savedTenant._id.toString());
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user, user.tenant_id.toString());
  }

  private generateToken(user: User, tenantId: string) {
    const payload = {
      sub: (user as any)._id?.toString?.() ?? undefined,
      email: (user as any).email,
      role: (user as any).role,
      tenant_id: tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      tenant_id: tenantId,
    };
  }
}
