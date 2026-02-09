import { Sequelize } from 'sequelize';
import config from '../config/database';

import { initUser, User } from './User';
import { initRefreshToken, RefreshToken } from './RefreshToken';
import { initRestaurant, Restaurant } from './Restaurant';
import { initCategory, Category } from './Category';
import { initProduct, Product } from './Product';
import { initProductOption, ProductOption } from './ProductOption';
import { initOptionItem, OptionItem } from './OptionItem';
import { initOrder, Order } from './Order';
import { initOrderItem, OrderItem } from './OrderItem';
import { initOrderItemOption, OrderItemOption } from './OrderItemOption';
import { initInput, Input } from './Input';
import { initProductInput, ProductInput } from './ProductInput';

const env = (process.env.NODE_ENV || 'development') as keyof typeof config;
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: dbConfig.pool,
  }
);


initUser(sequelize);
initRefreshToken(sequelize);
initRestaurant(sequelize);
initCategory(sequelize);
initProduct(sequelize);
initProductOption(sequelize);
initOptionItem(sequelize);
initOrder(sequelize);
initOrderItem(sequelize);
initOrderItemOption(sequelize);
initInput(sequelize);
initProductInput(sequelize);


User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
User.hasMany(Restaurant, { foreignKey: 'owner_id', as: 'restaurants' });
User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });


RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });


Restaurant.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Restaurant.hasMany(Category, { foreignKey: 'restaurant_id', as: 'categories' });
Restaurant.hasMany(Product, { foreignKey: 'restaurant_id', as: 'products' });
Restaurant.hasMany(Order, { foreignKey: 'restaurant_id', as: 'orders' });


Category.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });


Product.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });


ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductOption.hasMany(OptionItem, { foreignKey: 'option_id', as: 'items' });


OptionItem.belongsTo(ProductOption, { foreignKey: 'option_id', as: 'option' });


Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });


OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
OrderItem.hasMany(OrderItemOption, { foreignKey: 'order_item_id', as: 'options' });


OrderItemOption.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'orderItem' });


Input.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
Input.hasMany(ProductInput, { foreignKey: 'input_id', as: 'productInputs' });


ProductInput.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductInput.belongsTo(Input, { foreignKey: 'input_id', as: 'input' });


Product.hasMany(ProductInput, { foreignKey: 'product_id', as: 'inputs' });


Restaurant.hasMany(Input, { foreignKey: 'restaurant_id', as: 'inputs' });

export {
  sequelize,
  Sequelize,
  User,
  RefreshToken,
  Restaurant,
  Category,
  Product,
  ProductOption,
  OptionItem,
  Order,
  OrderItem,
  OrderItemOption,
  Input,
  ProductInput,
};

export default {
  sequelize,
  Sequelize,
  User,
  RefreshToken,
  Restaurant,
  Category,
  Product,
  ProductOption,
  OptionItem,
  Order,
  OrderItem,
  OrderItemOption,
  Input,
  ProductInput,
};
