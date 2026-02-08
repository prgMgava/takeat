import { DataTypes, Model, Sequelize } from 'sequelize';
import { InputAttributes, InputCreationAttributes } from '../types';

export class Input extends Model<InputAttributes, InputCreationAttributes> implements InputAttributes {
  declare id: string;
  declare restaurantId: string;
  declare name: string;
  declare description: string | null;
  declare unit: string;
  declare stockQuantity: number;
  declare minStock: number;
  declare costPerUnit: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initInput = (sequelize: Sequelize): typeof Input => {
  Input.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'un',
      },
      stockQuantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
        field: 'stock_quantity',
        get() {
          const value = this.getDataValue('stockQuantity');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      minStock: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
        field: 'min_stock',
        get() {
          const value = this.getDataValue('minStock');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      costPerUnit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'cost_per_unit',
        get() {
          const value = this.getDataValue('costPerUnit');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      tableName: 'inputs',
      timestamps: true,
      underscored: true,
    }
  );

  return Input;
};

export default initInput;
