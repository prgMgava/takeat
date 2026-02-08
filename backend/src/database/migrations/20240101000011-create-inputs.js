'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inputs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'restaurants',
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
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'un',
        comment: 'Unidade de medida: un, kg, g, l, ml, etc.',
      },
      stock_quantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
      },
      min_stock: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
        comment: 'Estoque mínimo para alerta',
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Índices para melhor performance
    await queryInterface.addIndex('inputs', ['restaurant_id']);
    await queryInterface.addIndex('inputs', ['name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inputs');
  },
};
