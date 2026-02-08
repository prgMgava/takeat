import { DataTypes, Model, Sequelize } from 'sequelize';
import { OrderItemAttributes, OrderItemCreationAttributes } from '../types';

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare productName: string;
  declare productPrice: number;
  declare quantity: number;
  declare subtotal: number;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initOrderItem = (sequelize: Sequelize): typeof OrderItem => {
  OrderItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
        references: {
          model: 'orders',
          key: 'id',
        },
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products',
          key: 'id',
        },
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'product_name',
      },
      productPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'product_price',
        get() {
          const value = this.getDataValue('productPrice');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('subtotal');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'order_items',
      timestamps: true,
      underscored: true,
    }
  );

  return OrderItem;
};

export default initOrderItem;
