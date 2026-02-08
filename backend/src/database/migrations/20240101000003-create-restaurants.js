'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cuisine: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      logo_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      banner_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'São Paulo',
      },
      state: {
        type: Sequelize.STRING(2),
        allowNull: false,
        defaultValue: 'SP',
      },
      zip_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '00000-000',
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      delivery_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      min_order_value: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      estimated_delivery_time: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_open: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0,
      },
      total_ratings: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('restaurants', ['owner_id']);
    await queryInterface.addIndex('restaurants', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('restaurants');
  },
};
