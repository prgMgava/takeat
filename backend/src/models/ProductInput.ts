import { DataTypes, Model, Sequelize } from 'sequelize';
import { ProductInputAttributes, ProductInputCreationAttributes } from '../types';

export class ProductInput extends Model<ProductInputAttributes, ProductInputCreationAttributes> implements ProductInputAttributes {
  declare id: string;
  declare productId: string;
  declare inputId: string;
  declare quantity: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initProductInput = (sequelize: Sequelize): typeof ProductInput => {
  ProductInput.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      inputId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'input_id',
        references: {
          model: 'inputs',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        get() {
          const value = this.getDataValue('quantity');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
    },
    {
      sequelize,
      tableName: 'product_inputs',
      timestamps: true,
      underscored: true,
    }
  );

  return ProductInput;
};

export default initProductInput;
