import { DataTypes, Model, Sequelize } from 'sequelize';
import { RestaurantAttributes, RestaurantCreationAttributes } from '../types';

export class Restaurant extends Model<RestaurantAttributes, RestaurantCreationAttributes> implements RestaurantAttributes {
  declare id: string;
  declare ownerId: string;
  declare name: string;
  declare description: string | null;
  declare cuisine: string | null;
  declare address: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare phone: string | null;
  declare email: string | null;
  declare logoUrl: string | null;
  declare bannerUrl: string | null;
  declare deliveryFee: number;
  declare minOrderValue: number;
  declare estimatedDeliveryTime: number;
  declare isOpen: boolean;
  declare isActive: boolean;
  declare rating: number;
  declare totalRatings: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initRestaurant = (sequelize: Sequelize): typeof Restaurant => {
  Restaurant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'owner_id',
        references: {
          model: 'users',
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
      cuisine: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      zipCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'zip_code',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'logo_url',
      },
      bannerUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'banner_url',
      },
      deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'delivery_fee',
        get() {
          const value = this.getDataValue('deliveryFee');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      minOrderValue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'min_order_value',
        get() {
          const value = this.getDataValue('minOrderValue');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      estimatedDeliveryTime: {
        type: DataTypes.INTEGER,
        defaultValue: 45,
        field: 'estimated_delivery_time',
      },
      isOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_open',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
        get() {
          const value = this.getDataValue('rating');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      totalRatings: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_ratings',
      },
    },
    {
      sequelize,
      tableName: 'restaurants',
      timestamps: true,
      underscored: true,
    }
  );

  return Restaurant;
};

export default initRestaurant;
