'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Use fixed UUIDs for users and restaurants for idempotent seeding
    const adminId = '11111111-1111-1111-1111-111111111111';
    const ownerId = '22222222-2222-2222-2222-222222222222';
    const owner2Id = '33333333-3333-3333-3333-333333333333';
    const owner3Id = '44444444-4444-4444-4444-444444444444';
    const customerId = '55555555-5555-5555-5555-555555555555';
    const customer2Id = '66666666-6666-6666-6666-666666666666';
    const hashedPassword = await bcrypt.hash('123456', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@takeat.com',
        password: hashedPassword,
        name: 'Admin Takeat',
        phone: '11999999999',
        role: 'ADMIN',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: ownerId,
        email: 'restaurante@takeat.com',
        password: hashedPassword,
        name: 'João Silva',
        phone: '11988888888',
        role: 'RESTAURANT_OWNER',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: owner2Id,
        email: 'pizzaria@takeat.com',
        password: hashedPassword,
        name: 'Carlos Oliveira',
        phone: '11977776666',
        role: 'RESTAURANT_OWNER',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: owner3Id,
        email: 'japonesa@takeat.com',
        password: hashedPassword,
        name: 'Yuki Tanaka',
        phone: '11966665555',
        role: 'RESTAURANT_OWNER',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: customerId,
        email: 'cliente@takeat.com',
        password: hashedPassword,
        name: 'Maria Santos',
        phone: '11977777777',
        role: 'CUSTOMER',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: customer2Id,
        email: 'cliente2@takeat.com',
        password: hashedPassword,
        name: 'Pedro Almeida',
        phone: '11955554444',
        role: 'CUSTOMER',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], { ignoreDuplicates: true });

    // Create demo restaurants - Fixed UUIDs
    const restaurantId = 'aaaa1111-1111-1111-1111-111111111111';
    const restaurant2Id = 'aaaa2222-2222-2222-2222-222222222222';
    const restaurant3Id = 'aaaa3333-3333-3333-3333-333333333333';

    await queryInterface.bulkInsert('restaurants', [
      {
        id: restaurantId,
        owner_id: ownerId,
        name: 'Burguer Artesanal',
        description: 'Os melhores hambúrgueres artesanais da cidade, feitos com ingredientes frescos e de qualidade.',
        cuisine: 'Hambúrguer',
        logo_url: 'https://placehold.co/200x200/orange/white?text=BA',
        banner_url: 'https://placehold.co/1200x400/orange/white?text=Burguer+Artesanal',
        address: 'Rua das Flores, 123 - Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
        latitude: -23.5505,
        longitude: -46.6333,
        phone: '11988888888',
        email: 'contato@burguerartesanal.com',
        delivery_fee: 5.00,
        min_order_value: 25.00,
        estimated_delivery_time: '30-45 min',
        is_open: true,
        is_active: true,
        rating: 4.8,
        total_ratings: 150,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: restaurant2Id,
        owner_id: owner2Id,
        name: 'Pizzaria Bella Napoli',
        description: 'Pizzas artesanais assadas em forno a lenha, receitas tradicionais italianas.',
        cuisine: 'Pizza',
        logo_url: 'https://placehold.co/200x200/dc2626/white?text=BN',
        banner_url: 'https://placehold.co/1200x400/dc2626/white?text=Bella+Napoli',
        address: 'Av. Italia, 456 - Jardins',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01425-001',
        latitude: -23.5610,
        longitude: -46.6580,
        phone: '11977776666',
        email: 'contato@bellanapoli.com',
        delivery_fee: 7.00,
        min_order_value: 35.00,
        estimated_delivery_time: '40-60 min',
        is_open: true,
        is_active: true,
        rating: 4.6,
        total_ratings: 89,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: restaurant3Id,
        owner_id: owner3Id,
        name: 'Sushi Zen',
        description: 'Culinária japonesa autêntica com ingredientes frescos importados.',
        cuisine: 'Japonesa',
        logo_url: 'https://placehold.co/200x200/1e3a5f/white?text=SZ',
        banner_url: 'https://placehold.co/1200x400/1e3a5f/white?text=Sushi+Zen',
        address: 'Rua Liberdade, 789 - Liberdade',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01503-010',
        latitude: -23.5580,
        longitude: -46.6350,
        phone: '11966665555',
        email: 'contato@sushizen.com',
        delivery_fee: 8.00,
        min_order_value: 50.00,
        estimated_delivery_time: '35-50 min',
        is_open: true,
        is_active: true,
        rating: 4.9,
        total_ratings: 220,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], { ignoreDuplicates: true });

    // Create demo categories - Burguer Artesanal
    const categoryBurgers = uuidv4();
    const categoryDrinks = uuidv4();
    const categorySides = uuidv4();

    // Categories - Pizzaria Bella Napoli
    const categoryPizzasTrad = uuidv4();
    const categoryPizzasEsp = uuidv4();
    const categoryDrinksPizza = uuidv4();

    // Categories - Sushi Zen
    const categorySushis = uuidv4();
    const categorySashimis = uuidv4();
    const categoryTemakis = uuidv4();
    const categoryDrinksJap = uuidv4();

    await queryInterface.bulkInsert('categories', [
      // Burguer Artesanal
      {
        id: categoryBurgers,
        restaurant_id: restaurantId,
        name: 'Hambúrgueres',
        description: 'Nossos deliciosos hambúrgueres artesanais',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categorySides,
        restaurant_id: restaurantId,
        name: 'Acompanhamentos',
        description: 'Porções e acompanhamentos',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categoryDrinks,
        restaurant_id: restaurantId,
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e mais',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Pizzaria Bella Napoli
      {
        id: categoryPizzasTrad,
        restaurant_id: restaurant2Id,
        name: 'Pizzas Tradicionais',
        description: 'Sabores clássicos da culinária italiana',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categoryPizzasEsp,
        restaurant_id: restaurant2Id,
        name: 'Pizzas Especiais',
        description: 'Criações exclusivas do chef',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categoryDrinksPizza,
        restaurant_id: restaurant2Id,
        name: 'Bebidas',
        description: 'Refrigerantes, vinhos e cervejas',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Sushi Zen
      {
        id: categorySushis,
        restaurant_id: restaurant3Id,
        name: 'Sushis',
        description: 'Sushis frescos e tradicionais',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categorySashimis,
        restaurant_id: restaurant3Id,
        name: 'Sashimis',
        description: 'Cortes finos de peixe fresco',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categoryTemakis,
        restaurant_id: restaurant3Id,
        name: 'Temakis',
        description: 'Cones de alga recheados',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: categoryDrinksJap,
        restaurant_id: restaurant3Id,
        name: 'Bebidas',
        description: 'Sake, cervejas japonesas e refrigerantes',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create demo products - Burguer Artesanal
    const productBurger1 = uuidv4();
    const productBurger2 = uuidv4();
    const productBurger3 = uuidv4();
    const productFries = uuidv4();
    const productOnionRings = uuidv4();
    const productCoke = uuidv4();
    const productJuice = uuidv4();

    // Products - Pizzaria Bella Napoli
    const productPizzaMargherita = uuidv4();
    const productPizzaPepperoni = uuidv4();
    const productPizzaQuatroQueijos = uuidv4();
    const productPizzaFrango = uuidv4();
    const productPizzaPortuguesa = uuidv4();
    const productVinhoTinto = uuidv4();

    // Products - Sushi Zen
    const productComboSushi = uuidv4();
    const productSashimiSalmao = uuidv4();
    const productSashimiAtum = uuidv4();
    const productTemakiSalmao = uuidv4();
    const productTemakiAtum = uuidv4();
    const productSake = uuidv4();

    await queryInterface.bulkInsert('products', [
      // ========== BURGUER ARTESANAL ==========
      {
        id: productBurger1,
        restaurant_id: restaurantId,
        category_id: categoryBurgers,
        name: 'Classic Burger',
        description: 'Pão brioche, 180g de blend bovino, queijo cheddar, alface, tomate, cebola roxa e molho especial.',
        price: 32.90,
        image_url: 'https://placehold.co/400x300/orange/white?text=Classic+Burger',
        preparation_time: 20,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productBurger2,
        restaurant_id: restaurantId,
        category_id: categoryBurgers,
        name: 'Double Bacon',
        description: 'Pão brioche, 2x180g de blend bovino, bacon crocante, queijo cheddar duplo, cebola caramelizada e molho BBQ.',
        price: 45.90,
        promotional_price: 39.90,
        image_url: 'https://placehold.co/400x300/orange/white?text=Double+Bacon',
        preparation_time: 25,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productBurger3,
        restaurant_id: restaurantId,
        category_id: categoryBurgers,
        name: 'Veggie Burger',
        description: 'Pão integral, hambúrguer de grão-de-bico, queijo mussarela, rúcula, tomate seco e molho de ervas.',
        price: 29.90,
        image_url: 'https://placehold.co/400x300/green/white?text=Veggie+Burger',
        preparation_time: 20,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productFries,
        restaurant_id: restaurantId,
        category_id: categorySides,
        name: 'Batata Frita',
        description: 'Porção de batata frita crocante com sal e orégano.',
        price: 18.90,
        image_url: 'https://placehold.co/400x300/yellow/black?text=Batata+Frita',
        preparation_time: 15,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productOnionRings,
        restaurant_id: restaurantId,
        category_id: categorySides,
        name: 'Onion Rings',
        description: 'Anéis de cebola empanados e fritos, servidos com molho ranch.',
        price: 22.90,
        image_url: 'https://placehold.co/400x300/brown/white?text=Onion+Rings',
        preparation_time: 15,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productCoke,
        restaurant_id: restaurantId,
        category_id: categoryDrinks,
        name: 'Refrigerante',
        description: 'Lata 350ml',
        price: 6.90,
        image_url: 'https://placehold.co/400x300/red/white?text=Refrigerante',
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productJuice,
        restaurant_id: restaurantId,
        category_id: categoryDrinks,
        name: 'Suco Natural',
        description: 'Copo 500ml - Laranja, Limão ou Maracujá',
        price: 12.90,
        image_url: 'https://placehold.co/400x300/orange/white?text=Suco',
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========== PIZZARIA BELLA NAPOLI ==========
      {
        id: productPizzaMargherita,
        restaurant_id: restaurant2Id,
        category_id: categoryPizzasTrad,
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mussarela, tomate fresco, manjericão e azeite.',
        price: 49.90,
        image_url: 'https://placehold.co/400x300/dc2626/white?text=Margherita',
        preparation_time: 25,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productPizzaPepperoni,
        restaurant_id: restaurant2Id,
        category_id: categoryPizzasTrad,
        name: 'Pizza Pepperoni',
        description: 'Molho de tomate, mussarela e pepperoni fatiado.',
        price: 54.90,
        image_url: 'https://placehold.co/400x300/dc2626/white?text=Pepperoni',
        preparation_time: 25,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productPizzaQuatroQueijos,
        restaurant_id: restaurant2Id,
        category_id: categoryPizzasTrad,
        name: 'Pizza Quatro Queijos',
        description: 'Mussarela, gorgonzola, parmesão e catupiry.',
        price: 56.90,
        image_url: 'https://placehold.co/400x300/dc2626/white?text=4+Queijos',
        preparation_time: 25,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productPizzaFrango,
        restaurant_id: restaurant2Id,
        category_id: categoryPizzasEsp,
        name: 'Pizza Frango com Catupiry',
        description: 'Molho de tomate, mussarela, frango desfiado, catupiry e milho.',
        price: 52.90,
        image_url: 'https://placehold.co/400x300/dc2626/white?text=Frango',
        preparation_time: 25,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productPizzaPortuguesa,
        restaurant_id: restaurant2Id,
        category_id: categoryPizzasEsp,
        name: 'Pizza Portuguesa',
        description: 'Molho de tomate, mussarela, presunto, ovo, cebola, azeitona e pimentão.',
        price: 54.90,
        image_url: 'https://placehold.co/400x300/dc2626/white?text=Portuguesa',
        preparation_time: 25,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productVinhoTinto,
        restaurant_id: restaurant2Id,
        category_id: categoryDrinksPizza,
        name: 'Vinho Tinto Suave',
        description: 'Garrafa 750ml',
        price: 45.00,
        image_url: 'https://placehold.co/400x300/722f37/white?text=Vinho',
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========== SUSHI ZEN ==========
      {
        id: productComboSushi,
        restaurant_id: restaurant3Id,
        category_id: categorySushis,
        name: 'Combo Sushi 20 peças',
        description: '10 hossomakis, 6 uramakis e 4 niguiris variados.',
        price: 79.90,
        image_url: 'https://placehold.co/400x300/1e3a5f/white?text=Combo+Sushi',
        preparation_time: 30,
        servings: 2,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productSashimiSalmao,
        restaurant_id: restaurant3Id,
        category_id: categorySashimis,
        name: 'Sashimi de Salmão',
        description: '10 fatias de salmão fresco.',
        price: 52.90,
        image_url: 'https://placehold.co/400x300/fa8072/white?text=Sashimi+Salmao',
        preparation_time: 15,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productSashimiAtum,
        restaurant_id: restaurant3Id,
        category_id: categorySashimis,
        name: 'Sashimi de Atum',
        description: '10 fatias de atum premium.',
        price: 58.90,
        image_url: 'https://placehold.co/400x300/8b0000/white?text=Sashimi+Atum',
        preparation_time: 15,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productTemakiSalmao,
        restaurant_id: restaurant3Id,
        category_id: categoryTemakis,
        name: 'Temaki Salmão',
        description: 'Cone de alga com arroz, salmão, cream cheese e cebolinha.',
        price: 28.90,
        image_url: 'https://placehold.co/400x300/1e3a5f/white?text=Temaki+Salmao',
        preparation_time: 10,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productTemakiAtum,
        restaurant_id: restaurant3Id,
        category_id: categoryTemakis,
        name: 'Temaki Atum',
        description: 'Cone de alga com arroz, atum, pepino e gergelim.',
        price: 32.90,
        image_url: 'https://placehold.co/400x300/1e3a5f/white?text=Temaki+Atum',
        preparation_time: 10,
        servings: 1,
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: productSake,
        restaurant_id: restaurant3Id,
        category_id: categoryDrinksJap,
        name: 'Sake',
        description: 'Garrafa 300ml - Servido quente ou frio.',
        price: 35.00,
        image_url: 'https://placehold.co/400x300/e5e5e5/black?text=Sake',
        is_available: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create product options
    const optionMeat = uuidv4();
    const optionExtras = uuidv4();
    const optionDrinkFlavor = uuidv4();
    const optionJuiceFlavor = uuidv4();

    await queryInterface.bulkInsert('product_options', [
      {
        id: optionMeat,
        product_id: productBurger1,
        name: 'Ponto da Carne',
        description: 'Escolha o ponto da carne',
        is_required: true,
        min_selections: 1,
        max_selections: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: optionExtras,
        product_id: productBurger1,
        name: 'Adicionais',
        description: 'Adicione ingredientes extras',
        is_required: false,
        min_selections: 0,
        max_selections: 5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: optionDrinkFlavor,
        product_id: productCoke,
        name: 'Sabor',
        description: 'Escolha o sabor',
        is_required: true,
        min_selections: 1,
        max_selections: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: optionJuiceFlavor,
        product_id: productJuice,
        name: 'Sabor',
        description: 'Escolha o sabor do suco',
        is_required: true,
        min_selections: 1,
        max_selections: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create option items
    await queryInterface.bulkInsert('option_items', [
      // Meat point options
      { id: uuidv4(), option_id: optionMeat, name: 'Mal Passado', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionMeat, name: 'Ao Ponto', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionMeat, name: 'Bem Passado', price: 0, created_at: new Date(), updated_at: new Date() },
      // Extra options
      { id: uuidv4(), option_id: optionExtras, name: 'Bacon Extra', price: 5.00, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionExtras, name: 'Queijo Extra', price: 4.00, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionExtras, name: 'Ovo', price: 3.00, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionExtras, name: 'Cebola Caramelizada', price: 3.50, created_at: new Date(), updated_at: new Date() },
      // Drink flavors
      { id: uuidv4(), option_id: optionDrinkFlavor, name: 'Coca-Cola', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionDrinkFlavor, name: 'Coca-Cola Zero', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionDrinkFlavor, name: 'Guaraná', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionDrinkFlavor, name: 'Fanta Laranja', price: 0, created_at: new Date(), updated_at: new Date() },
      // Juice flavors
      { id: uuidv4(), option_id: optionJuiceFlavor, name: 'Laranja', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionJuiceFlavor, name: 'Limão', price: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), option_id: optionJuiceFlavor, name: 'Maracujá', price: 0, created_at: new Date(), updated_at: new Date() },
    ]);

    // ============================================================
    // INPUTS (INSUMOS/INGREDIENTES) - ESTOQUE FÍSICO
    // ============================================================
    // Inputs - Burguer Artesanal
    const inputPao = uuidv4();
    const inputCarne = uuidv4();
    const inputQueijo = uuidv4();
    const inputBacon = uuidv4();
    const inputAlface = uuidv4();
    const inputTomate = uuidv4();
    const inputCebola = uuidv4();
    const inputBatata = uuidv4();
    const inputMolhoEspecial = uuidv4();
    const inputMolhoBBQ = uuidv4();
    const inputPaoIntegral = uuidv4();
    const inputHamburguerGraoDeBico = uuidv4();
    const inputMussarela = uuidv4();
    const inputRucula = uuidv4();
    const inputTomateSeco = uuidv4();
    const inputOleo = uuidv4();

    // Inputs - Pizzaria Bella Napoli
    const inputMassaPizza = uuidv4();
    const inputMolhoTomate = uuidv4();
    const inputMussarelaPizza = uuidv4();
    const inputPepperoni = uuidv4();
    const inputGorgonzola = uuidv4();
    const inputParmesao = uuidv4();
    const inputCatupiry = uuidv4();
    const inputFrango = uuidv4();
    const inputPresunto = uuidv4();
    const inputOvo = uuidv4();
    const inputAzeitona = uuidv4();
    const inputPimentao = uuidv4();
    const inputManjericao = uuidv4();

    // Inputs - Sushi Zen
    const inputSalmao = uuidv4();
    const inputAtum = uuidv4();
    const inputArroz = uuidv4();
    const inputAlgaNori = uuidv4();
    const inputCreamCheese = uuidv4();
    const inputPepino = uuidv4();
    const inputGergelim = uuidv4();
    const inputCebolinha = uuidv4();

    await queryInterface.bulkInsert('inputs', [
      {
        id: inputPao,
        restaurant_id: restaurantId,
        name: 'Pão Brioche',
        description: 'Pão brioche para hambúrguer',
        unit: 'un',
        stock_quantity: 100,
        min_stock: 20,
        cost_per_unit: 1.50,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputCarne,
        restaurant_id: restaurantId,
        name: 'Blend Bovino 180g',
        description: 'Hambúrguer de blend bovino',
        unit: 'un',
        stock_quantity: 80,
        min_stock: 15,
        cost_per_unit: 8.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputQueijo,
        restaurant_id: restaurantId,
        name: 'Queijo Cheddar',
        description: 'Fatia de queijo cheddar',
        unit: 'un',
        stock_quantity: 150,
        min_stock: 30,
        cost_per_unit: 1.20,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputBacon,
        restaurant_id: restaurantId,
        name: 'Bacon',
        description: 'Fatias de bacon',
        unit: 'g',
        stock_quantity: 5000,
        min_stock: 500,
        cost_per_unit: 0.05,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputAlface,
        restaurant_id: restaurantId,
        name: 'Alface',
        description: 'Folhas de alface',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 500,
        cost_per_unit: 0.02,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputTomate,
        restaurant_id: restaurantId,
        name: 'Tomate',
        description: 'Rodelas de tomate',
        unit: 'g',
        stock_quantity: 4000,
        min_stock: 500,
        cost_per_unit: 0.015,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputCebola,
        restaurant_id: restaurantId,
        name: 'Cebola Roxa',
        description: 'Rodelas de cebola roxa',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 400,
        cost_per_unit: 0.01,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputBatata,
        restaurant_id: restaurantId,
        name: 'Batata',
        description: 'Batata para fritas',
        unit: 'kg',
        stock_quantity: 30,
        min_stock: 5,
        cost_per_unit: 6.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputMolhoEspecial,
        restaurant_id: restaurantId,
        name: 'Molho Especial',
        description: 'Molho especial da casa',
        unit: 'ml',
        stock_quantity: 5000,
        min_stock: 500,
        cost_per_unit: 0.03,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputMolhoBBQ,
        restaurant_id: restaurantId,
        name: 'Molho BBQ',
        description: 'Molho barbecue',
        unit: 'ml',
        stock_quantity: 3000,
        min_stock: 300,
        cost_per_unit: 0.04,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputPaoIntegral,
        restaurant_id: restaurantId,
        name: 'Pão Integral',
        description: 'Pão integral para hambúrguer',
        unit: 'un',
        stock_quantity: 50,
        min_stock: 10,
        cost_per_unit: 2.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputHamburguerGraoDeBico,
        restaurant_id: restaurantId,
        name: 'Hambúrguer de Grão-de-Bico',
        description: 'Hambúrguer vegano de grão-de-bico',
        unit: 'un',
        stock_quantity: 30,
        min_stock: 5,
        cost_per_unit: 5.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputMussarela,
        restaurant_id: restaurantId,
        name: 'Queijo Mussarela',
        description: 'Fatia de queijo mussarela',
        unit: 'un',
        stock_quantity: 100,
        min_stock: 20,
        cost_per_unit: 1.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputRucula,
        restaurant_id: restaurantId,
        name: 'Rúcula',
        description: 'Folhas de rúcula',
        unit: 'g',
        stock_quantity: 2000,
        min_stock: 300,
        cost_per_unit: 0.04,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputTomateSeco,
        restaurant_id: restaurantId,
        name: 'Tomate Seco',
        description: 'Tomate seco em conserva',
        unit: 'g',
        stock_quantity: 1500,
        min_stock: 200,
        cost_per_unit: 0.08,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputOleo,
        restaurant_id: restaurantId,
        name: 'Óleo para Fritura',
        description: 'Óleo de soja para fritura',
        unit: 'l',
        stock_quantity: 20,
        min_stock: 5,
        cost_per_unit: 8.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========== INPUTS PIZZARIA BELLA NAPOLI ==========
      {
        id: inputMassaPizza,
        restaurant_id: restaurant2Id,
        name: 'Massa de Pizza',
        description: 'Massa fresca para pizza grande',
        unit: 'un',
        stock_quantity: 50,
        min_stock: 10,
        cost_per_unit: 5.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputMolhoTomate,
        restaurant_id: restaurant2Id,
        name: 'Molho de Tomate',
        description: 'Molho de tomate para pizza',
        unit: 'ml',
        stock_quantity: 10000,
        min_stock: 2000,
        cost_per_unit: 0.02,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputMussarelaPizza,
        restaurant_id: restaurant2Id,
        name: 'Mussarela',
        description: 'Queijo mussarela fatiado',
        unit: 'g',
        stock_quantity: 10000,
        min_stock: 2000,
        cost_per_unit: 0.04,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputPepperoni,
        restaurant_id: restaurant2Id,
        name: 'Pepperoni',
        description: 'Salame pepperoni fatiado',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 500,
        cost_per_unit: 0.08,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputGorgonzola,
        restaurant_id: restaurant2Id,
        name: 'Gorgonzola',
        description: 'Queijo gorgonzola',
        unit: 'g',
        stock_quantity: 2000,
        min_stock: 400,
        cost_per_unit: 0.10,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputParmesao,
        restaurant_id: restaurant2Id,
        name: 'Parmesão',
        description: 'Queijo parmesão ralado',
        unit: 'g',
        stock_quantity: 2000,
        min_stock: 400,
        cost_per_unit: 0.12,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputCatupiry,
        restaurant_id: restaurant2Id,
        name: 'Catupiry',
        description: 'Requeijão catupiry',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 500,
        cost_per_unit: 0.05,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputFrango,
        restaurant_id: restaurant2Id,
        name: 'Frango Desfiado',
        description: 'Frango cozido e desfiado',
        unit: 'g',
        stock_quantity: 5000,
        min_stock: 1000,
        cost_per_unit: 0.03,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputPresunto,
        restaurant_id: restaurant2Id,
        name: 'Presunto',
        description: 'Presunto fatiado',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 500,
        cost_per_unit: 0.04,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputOvo,
        restaurant_id: restaurant2Id,
        name: 'Ovo',
        description: 'Ovo de galinha',
        unit: 'un',
        stock_quantity: 100,
        min_stock: 20,
        cost_per_unit: 0.80,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputAzeitona,
        restaurant_id: restaurant2Id,
        name: 'Azeitona',
        description: 'Azeitona preta fatiada',
        unit: 'g',
        stock_quantity: 2000,
        min_stock: 400,
        cost_per_unit: 0.03,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputPimentao,
        restaurant_id: restaurant2Id,
        name: 'Pimentão',
        description: 'Pimentão fatiado',
        unit: 'g',
        stock_quantity: 2000,
        min_stock: 400,
        cost_per_unit: 0.02,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputManjericao,
        restaurant_id: restaurant2Id,
        name: 'Manjericão',
        description: 'Folhas de manjericão fresco',
        unit: 'g',
        stock_quantity: 500,
        min_stock: 100,
        cost_per_unit: 0.15,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========== INPUTS SUSHI ZEN ==========
      {
        id: inputSalmao,
        restaurant_id: restaurant3Id,
        name: 'Salmão Fresco',
        description: 'Filé de salmão fresco',
        unit: 'g',
        stock_quantity: 5000,
        min_stock: 1000,
        cost_per_unit: 0.12,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputAtum,
        restaurant_id: restaurant3Id,
        name: 'Atum Premium',
        description: 'Filé de atum premium',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 500,
        cost_per_unit: 0.15,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputArroz,
        restaurant_id: restaurant3Id,
        name: 'Arroz para Sushi',
        description: 'Arroz japonês temperado',
        unit: 'g',
        stock_quantity: 10000,
        min_stock: 2000,
        cost_per_unit: 0.01,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputAlgaNori,
        restaurant_id: restaurant3Id,
        name: 'Alga Nori',
        description: 'Folha de alga nori',
        unit: 'un',
        stock_quantity: 200,
        min_stock: 50,
        cost_per_unit: 1.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputCreamCheese,
        restaurant_id: restaurant3Id,
        name: 'Cream Cheese',
        description: 'Cream cheese philadelphia',
        unit: 'g',
        stock_quantity: 3000,
        min_stock: 500,
        cost_per_unit: 0.05,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputPepino,
        restaurant_id: restaurant3Id,
        name: 'Pepino Japonês',
        description: 'Pepino japonês em tiras',
        unit: 'g',
        stock_quantity: 2000,
        min_stock: 400,
        cost_per_unit: 0.02,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputGergelim,
        restaurant_id: restaurant3Id,
        name: 'Gergelim',
        description: 'Sementes de gergelim branco',
        unit: 'g',
        stock_quantity: 1000,
        min_stock: 200,
        cost_per_unit: 0.08,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: inputCebolinha,
        restaurant_id: restaurant3Id,
        name: 'Cebolinha',
        description: 'Cebolinha verde picada',
        unit: 'g',
        stock_quantity: 500,
        min_stock: 100,
        cost_per_unit: 0.04,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // ============================================================
    // PRODUCT_INPUTS (FICHA TÉCNICA) - QUANTO DE CADA INSUMO POR PRODUTO
    // ============================================================
    await queryInterface.bulkInsert('product_inputs', [
      // Classic Burger: 1 pão, 1 carne, 1 queijo, 30g alface, 40g tomate, 20g cebola, 30ml molho especial
      { id: uuidv4(), product_id: productBurger1, input_id: inputPao, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger1, input_id: inputCarne, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger1, input_id: inputQueijo, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger1, input_id: inputAlface, quantity: 30, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger1, input_id: inputTomate, quantity: 40, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger1, input_id: inputCebola, quantity: 20, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger1, input_id: inputMolhoEspecial, quantity: 30, created_at: new Date(), updated_at: new Date() },

      // Double Bacon: 1 pão, 2 carnes, 2 queijos, 80g bacon, 40g cebola caramelizada, 40ml molho BBQ
      { id: uuidv4(), product_id: productBurger2, input_id: inputPao, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger2, input_id: inputCarne, quantity: 2, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger2, input_id: inputQueijo, quantity: 2, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger2, input_id: inputBacon, quantity: 80, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger2, input_id: inputCebola, quantity: 40, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger2, input_id: inputMolhoBBQ, quantity: 40, created_at: new Date(), updated_at: new Date() },

      // Veggie Burger: 1 pão integral, 1 hambúrguer grão-de-bico, 1 mussarela, 25g rúcula, 30g tomate seco
      { id: uuidv4(), product_id: productBurger3, input_id: inputPaoIntegral, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger3, input_id: inputHamburguerGraoDeBico, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger3, input_id: inputMussarela, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger3, input_id: inputRucula, quantity: 25, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productBurger3, input_id: inputTomateSeco, quantity: 30, created_at: new Date(), updated_at: new Date() },

      // Batata Frita: 0.3kg batata, 0.1l óleo
      { id: uuidv4(), product_id: productFries, input_id: inputBatata, quantity: 0.3, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productFries, input_id: inputOleo, quantity: 0.1, created_at: new Date(), updated_at: new Date() },

      // Onion Rings: 150g cebola, 0.15l óleo
      { id: uuidv4(), product_id: productOnionRings, input_id: inputCebola, quantity: 150, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productOnionRings, input_id: inputOleo, quantity: 0.15, created_at: new Date(), updated_at: new Date() },

      // ========== FICHA TÉCNICA PIZZARIA BELLA NAPOLI ==========
      // Pizza Margherita: 1 massa, 100ml molho, 200g mussarela, 50g tomate, 10g manjericão
      { id: uuidv4(), product_id: productPizzaMargherita, input_id: inputMassaPizza, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaMargherita, input_id: inputMolhoTomate, quantity: 100, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaMargherita, input_id: inputMussarelaPizza, quantity: 200, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaMargherita, input_id: inputManjericao, quantity: 10, created_at: new Date(), updated_at: new Date() },

      // Pizza Pepperoni: 1 massa, 100ml molho, 200g mussarela, 80g pepperoni
      { id: uuidv4(), product_id: productPizzaPepperoni, input_id: inputMassaPizza, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPepperoni, input_id: inputMolhoTomate, quantity: 100, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPepperoni, input_id: inputMussarelaPizza, quantity: 200, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPepperoni, input_id: inputPepperoni, quantity: 80, created_at: new Date(), updated_at: new Date() },

      // Pizza Quatro Queijos: 1 massa, 100ml molho, 150g mussarela, 50g gorgonzola, 30g parmesão, 50g catupiry
      { id: uuidv4(), product_id: productPizzaQuatroQueijos, input_id: inputMassaPizza, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaQuatroQueijos, input_id: inputMolhoTomate, quantity: 100, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaQuatroQueijos, input_id: inputMussarelaPizza, quantity: 150, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaQuatroQueijos, input_id: inputGorgonzola, quantity: 50, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaQuatroQueijos, input_id: inputParmesao, quantity: 30, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaQuatroQueijos, input_id: inputCatupiry, quantity: 50, created_at: new Date(), updated_at: new Date() },

      // Pizza Frango com Catupiry: 1 massa, 100ml molho, 150g mussarela, 150g frango, 80g catupiry
      { id: uuidv4(), product_id: productPizzaFrango, input_id: inputMassaPizza, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaFrango, input_id: inputMolhoTomate, quantity: 100, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaFrango, input_id: inputMussarelaPizza, quantity: 150, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaFrango, input_id: inputFrango, quantity: 150, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaFrango, input_id: inputCatupiry, quantity: 80, created_at: new Date(), updated_at: new Date() },

      // Pizza Portuguesa: 1 massa, 100ml molho, 180g mussarela, 60g presunto, 1 ovo, 30g cebola, 30g azeitona, 30g pimentão
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputMassaPizza, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputMolhoTomate, quantity: 100, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputMussarelaPizza, quantity: 180, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputPresunto, quantity: 60, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputOvo, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputAzeitona, quantity: 30, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productPizzaPortuguesa, input_id: inputPimentao, quantity: 30, created_at: new Date(), updated_at: new Date() },

      // ========== FICHA TÉCNICA SUSHI ZEN ==========
      // Combo Sushi 20 peças: 300g arroz, 150g salmão, 50g atum, 4 algas nori, 20g gergelim
      { id: uuidv4(), product_id: productComboSushi, input_id: inputArroz, quantity: 300, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productComboSushi, input_id: inputSalmao, quantity: 150, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productComboSushi, input_id: inputAtum, quantity: 50, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productComboSushi, input_id: inputAlgaNori, quantity: 4, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productComboSushi, input_id: inputGergelim, quantity: 20, created_at: new Date(), updated_at: new Date() },

      // Sashimi Salmão: 200g salmão
      { id: uuidv4(), product_id: productSashimiSalmao, input_id: inputSalmao, quantity: 200, created_at: new Date(), updated_at: new Date() },

      // Sashimi Atum: 200g atum
      { id: uuidv4(), product_id: productSashimiAtum, input_id: inputAtum, quantity: 200, created_at: new Date(), updated_at: new Date() },

      // Temaki Salmão: 80g arroz, 60g salmão, 1 alga nori, 30g cream cheese, 10g cebolinha
      { id: uuidv4(), product_id: productTemakiSalmao, input_id: inputArroz, quantity: 80, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiSalmao, input_id: inputSalmao, quantity: 60, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiSalmao, input_id: inputAlgaNori, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiSalmao, input_id: inputCreamCheese, quantity: 30, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiSalmao, input_id: inputCebolinha, quantity: 10, created_at: new Date(), updated_at: new Date() },

      // Temaki Atum: 80g arroz, 60g atum, 1 alga nori, 30g pepino, 10g gergelim
      { id: uuidv4(), product_id: productTemakiAtum, input_id: inputArroz, quantity: 80, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiAtum, input_id: inputAtum, quantity: 60, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiAtum, input_id: inputAlgaNori, quantity: 1, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiAtum, input_id: inputPepino, quantity: 30, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productTemakiAtum, input_id: inputGergelim, quantity: 10, created_at: new Date(), updated_at: new Date() },
    ]);

    console.log('Demo data seeded successfully!');
    console.log('');
    console.log('=========================================');
    console.log('Demo Users:');
    console.log('=========================================');
    console.log('  Admin: admin@takeat.com / 123456');
    console.log('');
    console.log('  Restaurant Owners:');
    console.log('    - restaurante@takeat.com / 123456 (Burguer Artesanal)');
    console.log('    - pizzaria@takeat.com / 123456 (Pizzaria Bella Napoli)');
    console.log('    - japonesa@takeat.com / 123456 (Sushi Zen)');
    console.log('');
    console.log('  Customers:');
    console.log('    - cliente@takeat.com / 123456');
    console.log('    - cliente2@takeat.com / 123456');
    console.log('');
    console.log('=========================================');
    console.log('Restaurants Created: 3');
    console.log('  - Burguer Artesanal (7 produtos, 16 insumos)');
    console.log('  - Pizzaria Bella Napoli (6 produtos, 13 insumos)');
    console.log('  - Sushi Zen (6 produtos, 8 insumos)');
    console.log('=========================================');
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order of dependencies
    await queryInterface.bulkDelete('product_inputs', null, {});
    await queryInterface.bulkDelete('inputs', null, {});
    await queryInterface.bulkDelete('option_items', null, {});
    await queryInterface.bulkDelete('product_options', null, {});
    await queryInterface.bulkDelete('order_item_options', null, {});
    await queryInterface.bulkDelete('order_items', null, {});
    await queryInterface.bulkDelete('orders', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('restaurants', null, {});
    await queryInterface.bulkDelete('refresh_tokens', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
