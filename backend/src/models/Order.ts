import { DataTypes, Model, Sequelize } from 'sequelize';
import { OrderAttributes, OrderCreationAttributes, OrderStatus } from '../types';

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: string;
  declare orderNumber: string;
  declare customerId: string;
  declare restaurantId: string;
  declare status: OrderStatus;
  declare subtotal: number;
  declare deliveryFee: number;
  declare total: number;
  declare deliveryAddress: string;
  declare deliveryCity: string;
  declare deliveryState: string;
  declare deliveryZipCode: string;
  declare deliveryPhone: string;
  declare notes: string | null;
  declare confirmedAt: Date | null;
  declare preparingAt: Date | null;
  declare readyAt: Date | null;
  declare outForDeliveryAt: Date | null;
  declare deliveredAt: Date | null;
  declare cancelledAt: Date | null;
  declare cancellationReason: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initOrder = (sequelize: Sequelize): typeof Order => {
  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'order_number',
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'customer_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      restaurantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'restaurant_id',
        references: {
          model: 'restaurants',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM(
          'PENDING',
          'CONFIRMED',
          'PREPARING',
          'READY',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED'
        ),
        defaultValue: 'PENDING',
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('subtotal');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'delivery_fee',
        get() {
          const value = this.getDataValue('deliveryFee');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('total');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      deliveryAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'delivery_address',
      },
      deliveryCity: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'delivery_city',
      },
      deliveryState: {
        type: DataTypes.STRING(2),
        allowNull: false,
        field: 'delivery_state',
      },
      deliveryZipCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'delivery_zip_code',
      },
      deliveryPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'delivery_phone',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'confirmed_at',
      },
      preparingAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'preparing_at',
      },
      readyAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'ready_at',
      },
      outForDeliveryAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'out_for_delivery_at',
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'delivered_at',
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at',
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'cancellation_reason',
      },
    },
    {
      sequelize,
      tableName: 'orders',
      timestamps: true,
      underscored: true,
    }
  );

  return Order;
};

export default initOrder;
