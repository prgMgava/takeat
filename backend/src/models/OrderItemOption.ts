import { DataTypes, Model, Sequelize } from 'sequelize';
import { OrderItemOptionAttributes, OrderItemOptionCreationAttributes } from '../types';

export class OrderItemOption extends Model<OrderItemOptionAttributes, OrderItemOptionCreationAttributes> implements OrderItemOptionAttributes {
  declare id: string;
  declare orderItemId: string;
  declare optionName: string;
  declare itemName: string;
  declare itemPrice: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initOrderItemOption = (sequelize: Sequelize): typeof OrderItemOption => {
  OrderItemOption.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_item_id',
        references: {
          model: 'order_items',
          key: 'id',
        },
      },
      optionName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'option_name',
      },
      itemName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'item_name',
      },
      itemPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'item_price',
        get() {
          const value = this.getDataValue('itemPrice');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
    },
    {
      sequelize,
      tableName: 'order_item_options',
      timestamps: true,
      underscored: true,
    }
  );

  return OrderItemOption;
};

export default initOrderItemOption;
