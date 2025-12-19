import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { tenancyPlugin } from '../plugins/tenancy.plugin';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrave';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: mongoUri,
        connectionFactory: (connection) => {
          connection.plugin(tenancyPlugin);
          return connection;
        },
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
