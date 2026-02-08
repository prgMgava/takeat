import { DataTypes, Model, Sequelize } from 'sequelize';
import { RefreshTokenAttributes, RefreshTokenCreationAttributes } from '../types';

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  declare id: string;
  declare token: string;
  declare userId: string;
  declare expiresAt: Date;
  declare isRevoked: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initRefreshToken = (sequelize: Sequelize): typeof RefreshToken => {
  RefreshToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_revoked',
      },
    },
    {
      sequelize,
      tableName: 'refresh_tokens',
      timestamps: true,
      underscored: true,
    }
  );

  return RefreshToken;
};

export default initRefreshToken;
