'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      order_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM(
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
      payment_status: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED'),
        defaultValue: 'PENDING',
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX'),
        allowNull: true,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      delivery_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      is_delivery: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      delivery_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      delivery_city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      delivery_state: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },
      delivery_zip_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      delivery_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      confirmed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      preparing_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ready_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      out_for_delivery_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['restaurant_id']);
    await queryInterface.addIndex('orders', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};
