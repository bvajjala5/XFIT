// Everyday foods pinned to the top of search results with friendly names and aliases.
// Each row: [USDA NDB id, friendly name, ...extra search aliases]. All nutrition comes from the USDA database
// (src/data/foods.json) by id — only the name and aliases are ours. Order matters: earlier = ranked higher.
export const CURATED = [
  // Fruit
  [9040, 'Banana', 'bananas'], [9003, 'Apple', 'apples'], [9200, 'Orange', 'oranges'], [9316, 'Strawberries', 'strawberry'],
  [9050, 'Blueberries', 'blueberry'], [9132, 'Grapes', 'grape'], [9326, 'Watermelon'], [9037, 'Avocado', 'avocados'],
  [9266, 'Pineapple'], [9176, 'Mango', 'mangoes'],
  // Meat & fish
  [5064, 'Chicken breast, cooked', 'chicken', 'grilled chicken', 'chicken breast', 'baked chicken'],
  [5062, 'Chicken breast, raw', 'raw chicken'],
  [5098, 'Chicken thigh, cooked', 'chicken thighs'],
  [23568, 'Ground beef 85/15, cooked', 'beef', 'ground beef', 'hamburger meat', 'mince'],
  [23563, 'Ground beef 90/10, cooked', 'lean ground beef', 'lean beef'],
  [23473, 'Ground beef 93/7, cooked', 'extra lean ground beef', 'lean ground beef'],
  [13454, 'Sirloin steak, cooked', 'steak', 'beef steak', 'sirloin'],
  [10042, 'Pork chop, cooked', 'pork', 'pork chops'], [10860, 'Bacon, cooked', 'bacon strips'],
  [5733, 'Turkey breast, cooked', 'turkey'], [7022, 'Hot dog (beef)', 'hotdog', 'frankfurter'],
  [15237, 'Salmon, cooked', 'salmon', 'fish'], [15121, 'Tuna, canned in water', 'tuna', 'canned tuna'],
  [15151, 'Shrimp, cooked', 'shrimp', 'prawns'], [15262, 'Tilapia, cooked', 'tilapia'], [15016, 'Cod, cooked', 'cod'],
  // Eggs
  [1129, 'Egg, hard-boiled', 'egg', 'eggs', 'boiled egg', 'boiled eggs'], [1132, 'Eggs, scrambled', 'scrambled eggs', 'egg', 'eggs'],
  [1128, 'Egg, fried', 'fried egg', 'egg', 'eggs'], [1123, 'Egg, raw', 'raw egg', 'egg', 'eggs'], [1124, 'Egg whites, raw', 'egg white', 'egg whites'],
  // Grains
  [20045, 'White rice, cooked', 'rice', 'white rice', 'steamed rice'], [20037, 'Brown rice, cooked', 'brown rice', 'rice'],
  [20121, 'Pasta, cooked', 'pasta', 'spaghetti', 'noodles', 'macaroni', 'penne'],
  [18069, 'White bread', 'bread', 'toast', 'white toast'], [18075, 'Whole wheat bread', 'wheat bread', 'bread', 'whole grain bread'],
  [18970, 'Flour tortilla', 'tortilla', 'wrap', 'burrito wrap'], [18001, 'Bagel, plain', 'bagel'],
  [8120, 'Oats, dry', 'oats', 'rolled oats', 'oatmeal dry'], [8121, 'Oatmeal, cooked', 'oatmeal', 'porridge', 'cooked oats'],
  [20137, 'Quinoa, cooked', 'quinoa'], [8020, 'Corn flakes', 'cereal', 'cornflakes'], [8037, 'Granola', 'granola'],
  // Vegetables
  [11674, 'Baked potato', 'potato', 'potatoes', 'baked potatoes'], [11508, 'Sweet potato, baked', 'sweet potato', 'sweet potatoes', 'potato'],
  [21138, 'French fries (fast food)', 'fries', 'french fries'], [11403, 'Oven fries', 'fries', 'french fries'],
  [11091, 'Broccoli, cooked', 'broccoli'], [11090, 'Broccoli, raw', 'raw broccoli'], [11457, 'Spinach, raw', 'spinach'],
  [11124, 'Carrots, raw', 'carrot', 'carrots'], [11529, 'Tomato', 'tomatoes'], [11205, 'Cucumber', 'cucumbers'],
  [11251, 'Romaine lettuce', 'lettuce', 'salad'], [11282, 'Onion', 'onions'], [11821, 'Red bell pepper', 'bell pepper', 'pepper', 'peppers'],
  [11168, 'Corn, cooked', 'corn', 'sweet corn'], [11053, 'Green beans, cooked', 'green beans', 'string beans'], [11260, 'Mushrooms', 'mushroom'],
  // Dairy & fats
  [1211, 'Whole milk', 'milk'], [1174, '2% milk', 'milk', 'reduced fat milk'], [1151, 'Skim milk', 'milk', 'fat free milk', 'nonfat milk'],
  [1256, 'Greek yogurt, plain nonfat', 'greek yogurt', 'yogurt', 'yoghurt'], [1117, 'Yogurt, plain low-fat', 'yogurt', 'yoghurt'],
  [1009, 'Cheddar cheese', 'cheese', 'cheddar'], [1026, 'Mozzarella cheese', 'mozzarella', 'cheese'], [1015, 'Cottage cheese', 'cottage cheese'],
  [1017, 'Cream cheese'], [1001, 'Butter'], [4053, 'Olive oil', 'oil'],
  // Nuts, beans, protein
  [16098, 'Peanut butter', 'pb', 'peanut butter', 'pbj'], [12061, 'Almonds', 'almond'], [12155, 'Walnuts', 'walnut'], [12087, 'Cashews', 'cashew'],
  [16087, 'Peanuts', 'peanut'], [16015, 'Black beans, cooked', 'black beans', 'beans'], [16057, 'Chickpeas, cooked', 'chickpeas', 'garbanzo beans'],
  [16070, 'Lentils, cooked', 'lentils', 'lentil'], [16426, 'Tofu, firm', 'tofu'], [16158, 'Hummus', 'hummus'],
  [14058, 'Whey protein powder', 'protein powder', 'whey', 'protein shake', 'whey protein'],
  // Treats & drinks
  [19296, 'Honey'], [19335, 'Sugar', 'white sugar'], [19904, 'Dark chocolate', 'chocolate'], [19095, 'Vanilla ice cream', 'ice cream'],
  [14148, 'Cola', 'soda', 'coke', 'pepsi'], [9206, 'Orange juice', 'oj', 'juice'], [14209, 'Black coffee', 'coffee'], [14003, 'Beer'],
  [21224, 'Cheese pizza', 'pizza'], [21089, 'Cheeseburger (fast food)', 'cheeseburger', 'burger'], [21393, 'Hamburger (fast food)', 'hamburger', 'burger'],
];
