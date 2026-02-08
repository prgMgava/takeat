'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_inputs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      input_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inputs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Quantidade do insumo necessária para produzir 1 unidade do produto',
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

    // Índice único para evitar duplicatas na ficha técnica
    await queryInterface.addIndex('product_inputs', ['product_id', 'input_id'], {
      unique: true,
      name: 'product_inputs_unique',
    });
    await queryInterface.addIndex('product_inputs', ['input_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_inputs');
  },
};
