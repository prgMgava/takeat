import { DataTypes, Model, Sequelize } from 'sequelize';
import { OptionItemAttributes, OptionItemCreationAttributes } from '../types';

export class OptionItem extends Model<OptionItemAttributes, OptionItemCreationAttributes> implements OptionItemAttributes {
  declare id: string;
  declare optionId: string;
  declare name: string;
  declare price: number;
  declare isDefault: boolean;
  declare isAvailable: boolean;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initOptionItem = (sequelize: Sequelize): typeof OptionItem => {
  OptionItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      optionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'option_id',
        references: {
          model: 'product_options',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        get() {
          const value = this.getDataValue('price');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_default',
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_available',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      sequelize,
      tableName: 'option_items',
      timestamps: true,
      underscored: true,
    }
  );

  return OptionItem;
};

export default initOptionItem;
