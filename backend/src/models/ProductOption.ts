import { DataTypes, Model, Sequelize } from 'sequelize';
import { ProductOptionAttributes, ProductOptionCreationAttributes } from '../types';

export class ProductOption extends Model<ProductOptionAttributes, ProductOptionCreationAttributes> implements ProductOptionAttributes {
  declare id: string;
  declare productId: string;
  declare name: string;
  declare description: string | null;
  declare isRequired: boolean;
  declare minSelections: number;
  declare maxSelections: number;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initProductOption = (sequelize: Sequelize): typeof ProductOption => {
  ProductOption.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_required',
      },
      minSelections: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'min_selections',
      },
      maxSelections: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'max_selections',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      sequelize,
      tableName: 'product_options',
      timestamps: true,
      underscored: true,
    }
  );

  return ProductOption;
};

export default initProductOption;
