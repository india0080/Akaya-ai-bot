/**
 * Mock grocery catalogue (SAMPLE DATA). Prices are realistic Indian retail levels for demos only and
 * are not live store prices. Each item has Hindi / Hinglish synonyms used by the list parser.
 */
import type { Unit } from '../types.js';

export interface Pack {
  brand: string;
  name: string;
  size: number; // base units
  price: number; // ₹ reference price (stores vary around it)
  mrp?: number;
}
export interface ItemDef {
  key: string;
  name: string;
  emoji: string;
  unit: Unit;
  /** matched longest-first; lowercase latin + Devanagari */
  words: string[];
  /** default quantity when the list gives none (base units) */
  defaultQty: number;
  packs: Pack[];
  /** other item keys that can stand in when this item is unavailable */
  subs?: string[];
  category: 'staples' | 'dairy' | 'produce' | 'bakery' | 'snacks' | 'beverages' | 'household' | 'personal';
}

const p = (brand: string, name: string, size: number, price: number, mrp?: number): Pack => ({ brand, name, size, price, mrp });

export const ITEMS: ItemDef[] = [
  { key: 'atta', name: 'Atta (wheat flour)', emoji: '🌾', unit: 'g', category: 'staples', defaultQty: 5000,
    words: ['whole wheat atta', 'wheat flour', 'gehu ka atta', 'chakki atta', 'aata', 'atta', 'आटा'],
    packs: [p('Aashirvaad', 'Aashirvaad Shudh Chakki Atta', 5000, 289, 335), p('Aashirvaad', 'Aashirvaad Shudh Chakki Atta', 10000, 549, 640), p('Fortune', 'Fortune Chakki Fresh Atta', 5000, 259, 305), p('Pillsbury', 'Pillsbury Chakki Fresh Atta', 5000, 279, 320), p('Pillsbury', 'Pillsbury Chakki Fresh Atta', 1000, 66, 74)] },
  { key: 'milk', name: 'Milk', emoji: '🥛', unit: 'ml', category: 'dairy', defaultQty: 1000,
    words: ['toned milk', 'full cream milk', 'doodh', 'dudh', 'milk', 'दूध'],
    packs: [p('Amul', 'Amul Taaza Toned Milk', 500, 28), p('Amul', 'Amul Gold Full Cream Milk', 500, 34), p('Amul', 'Amul Taaza Toned Milk (Tetra)', 1000, 76), p('Mother Dairy', 'Mother Dairy Toned Milk', 500, 28), p('Nandini', 'Nandini Toned Milk', 500, 26)] },
  { key: 'eggs', name: 'Eggs', emoji: '🥚', unit: 'pc', category: 'dairy', defaultQty: 6,
    words: ['brown eggs', 'egg', 'eggs', 'anda', 'ande', 'unde', 'अंडे', 'अंडा', 'अण्डे'],
    packs: [p('Farm Fresh', 'Farm Fresh White Eggs', 6, 54), p('Farm Fresh', 'Farm Fresh White Eggs', 12, 99), p('Farm Fresh', 'Farm Fresh White Eggs', 30, 229), p('Eggoz', 'Eggoz Brown Eggs', 6, 79)] },
  { key: 'rice', name: 'Rice', emoji: '🍚', unit: 'g', category: 'staples', defaultQty: 5000,
    words: ['basmati rice', 'sona masoori', 'basmati', 'chawal', 'chaawal', 'rice', 'चावल'],
    packs: [p('India Gate', 'India Gate Basmati Rice Classic', 1000, 165, 190), p('Daawat', 'Daawat Rozana Basmati Rice', 5000, 449, 560), p('Fortune', 'Fortune Sona Masoori Rice', 5000, 389, 450), p('bb Royal', 'bb Royal Sona Masoori Rice', 5000, 369, 430)] },
  { key: 'onion', name: 'Onion', emoji: '🧅', unit: 'g', category: 'produce', defaultQty: 1000,
    words: ['onions', 'onion', 'pyaz', 'pyaaz', 'kanda', 'प्याज', 'प्याज़'],
    packs: [p('Fresh', 'Onion', 1000, 44), p('Fresh', 'Onion', 500, 24), p('Fresh', 'Onion', 2000, 85)] },
  { key: 'tomato', name: 'Tomato', emoji: '🍅', unit: 'g', category: 'produce', defaultQty: 500,
    words: ['tomatoes', 'tomato', 'tamatar', 'tamaatar', 'टमाटर'],
    packs: [p('Fresh', 'Tomato (Hybrid)', 500, 26), p('Fresh', 'Tomato (Hybrid)', 1000, 49)] },
  { key: 'potato', name: 'Potato', emoji: '🥔', unit: 'g', category: 'produce', defaultQty: 1000,
    words: ['potatoes', 'potato', 'aloo', 'alu', 'आलू'],
    packs: [p('Fresh', 'Potato', 1000, 39), p('Fresh', 'Potato', 2000, 75), p('Fresh', 'Potato', 500, 21)] },
  { key: 'sugar', name: 'Sugar', emoji: '🍬', unit: 'g', category: 'staples', defaultQty: 1000,
    words: ['sugar', 'cheeni', 'chini', 'shakkar', 'चीनी', 'शक्कर'],
    packs: [p('Madhur', 'Madhur Pure & Hygienic Sugar', 1000, 54, 60), p('Uttam', 'Uttam Sugar', 1000, 50, 58), p('Madhur', 'Madhur Sugar', 5000, 259, 295)] },
  { key: 'salt', name: 'Salt', emoji: '🧂', unit: 'g', category: 'staples', defaultQty: 1000,
    words: ['salt', 'namak', 'नमक'],
    packs: [p('Tata', 'Tata Salt Iodised', 1000, 28), p('Catch', 'Catch Sprinklers Iodised Salt', 1000, 25)] },
  { key: 'toor-dal', name: 'Toor dal', emoji: '🫘', unit: 'g', category: 'staples', defaultQty: 1000,
    words: ['toor dal', 'tur dal', 'arhar dal', 'arhar', 'toor', 'dal', 'daal', 'दाल', 'अरहर', 'तूर दाल'],
    packs: [p('Tata Sampann', 'Tata Sampann Unpolished Toor Dal', 1000, 179, 215), p('Tata Sampann', 'Tata Sampann Unpolished Toor Dal', 500, 95, 110), p('bb Popular', 'bb Popular Toor Dal', 1000, 159, 199)], subs: ['moong-dal'] },
  { key: 'moong-dal', name: 'Moong dal', emoji: '🫘', unit: 'g', category: 'staples', defaultQty: 500,
    words: ['moong dal', 'moong', 'मूंग दाल', 'मूंग'],
    packs: [p('Tata Sampann', 'Tata Sampann Moong Dal', 500, 89, 105), p('bb Popular', 'bb Popular Moong Dal', 1000, 155, 190)], subs: ['toor-dal'] },
  { key: 'paneer', name: 'Paneer', emoji: '🧀', unit: 'g', category: 'dairy', defaultQty: 200,
    words: ['malai paneer', 'cottage cheese', 'paneer', 'पनीर'],
    packs: [p('Amul', 'Amul Malai Paneer', 200, 90), p('Milky Mist', 'Milky Mist Paneer', 200, 95), p('Mother Dairy', 'Mother Dairy Paneer', 200, 88)] },
  { key: 'curd', name: 'Curd', emoji: '🥣', unit: 'g', category: 'dairy', defaultQty: 400,
    words: ['curd', 'dahi', 'yogurt', 'yoghurt', 'दही'],
    packs: [p('Amul', 'Amul Masti Dahi', 400, 35), p('Mother Dairy', 'Mother Dairy Classic Dahi', 400, 40), p('Nandini', 'Nandini Curd', 500, 32), p('Milky Mist', 'Milky Mist Set Curd', 400, 45)] },
  { key: 'butter', name: 'Butter', emoji: '🧈', unit: 'g', category: 'dairy', defaultQty: 100,
    words: ['butter', 'makhan', 'makkhan', 'मक्खन'],
    packs: [p('Amul', 'Amul Butter Pasteurised', 100, 58), p('Amul', 'Amul Butter Pasteurised', 500, 285), p('Mother Dairy', 'Mother Dairy Butter', 100, 56)] },
  { key: 'oil', name: 'Cooking oil', emoji: '🫗', unit: 'ml', category: 'staples', defaultQty: 1000,
    words: ['sunflower oil', 'cooking oil', 'refined oil', 'mustard oil', 'sarson ka tel', 'sarson tel', 'oil', 'tel', 'तेल'],
    packs: [p('Fortune', 'Fortune Sunlite Refined Sunflower Oil', 1000, 159, 185), p('Saffola', 'Saffola Gold Blended Oil', 1000, 199, 235), p('Fortune', 'Fortune Kachi Ghani Mustard Oil', 1000, 179, 210), p('Freedom', 'Freedom Refined Sunflower Oil', 1000, 149, 175), p('Fortune', 'Fortune Sunlite Sunflower Oil', 5000, 769, 900)] },
  { key: 'ghee', name: 'Ghee', emoji: '🫙', unit: 'ml', category: 'dairy', defaultQty: 500,
    words: ['desi ghee', 'ghee', 'ghi', 'घी'],
    packs: [p('Amul', 'Amul Pure Ghee', 1000, 649, 675), p('Amul', 'Amul Pure Ghee', 500, 335, 350), p('Nandini', 'Nandini Ghee', 500, 319, 340)] },
  { key: 'bread', name: 'Bread', emoji: '🍞', unit: 'pc', category: 'bakery', defaultQty: 1,
    words: ['brown bread', 'white bread', 'double roti', 'bread', 'pav', 'ब्रेड'],
    packs: [p('Britannia', 'Britannia 100% Whole Wheat Bread 400 g', 1, 55), p('Harvest Gold', 'Harvest Gold White Bread 400 g', 1, 45), p('Modern', 'Modern Brown Bread 400 g', 1, 50)] },
  { key: 'tea', name: 'Tea', emoji: '🍵', unit: 'g', category: 'beverages', defaultQty: 250,
    words: ['chai patti', 'chaipatti', 'tea leaves', 'tea', 'chai', 'चाय पत्ती', 'चायपत्ती', 'चाय'],
    packs: [p('Tata Tea', 'Tata Tea Premium', 500, 285, 310), p('Tata Tea', 'Tata Tea Premium', 250, 150, 160), p('Red Label', 'Brooke Bond Red Label', 500, 290, 315), p('Red Label', 'Brooke Bond Red Label', 250, 152, 165)] },
  { key: 'coffee', name: 'Coffee', emoji: '☕', unit: 'g', category: 'beverages', defaultQty: 100,
    words: ['instant coffee', 'filter coffee', 'coffee', 'कॉफी', 'कॉफ़ी'],
    packs: [p('Nescafe', 'Nescafe Classic Instant Coffee', 100, 345, 375), p('Bru', 'Bru Instant Coffee', 100, 249, 275), p('Narasus', 'Narasus Filter Coffee', 200, 165, 180)] },
  { key: 'noodles', name: 'Instant noodles', emoji: '🍜', unit: 'pc', category: 'snacks', defaultQty: 4,
    words: ['maggi', 'noodles', 'instant noodles', 'मैगी'],
    packs: [p('Maggi', 'Maggi 2-Minute Masala Noodles (4-pack)', 4, 60), p('Maggi', 'Maggi 2-Minute Masala Noodles (12-pack)', 12, 168), p('Yippee', 'Sunfeast YiPPee! Magic Masala (4-pack)', 4, 55)] },
  { key: 'banana', name: 'Banana', emoji: '🍌', unit: 'pc', category: 'produce', defaultQty: 6,
    words: ['bananas', 'banana', 'kela', 'kele', 'केला', 'केले'],
    packs: [p('Fresh', 'Banana Robusta (6 pc)', 6, 45), p('Fresh', 'Banana Yelakki (12 pc)', 12, 79)] },
  { key: 'apple', name: 'Apple', emoji: '🍎', unit: 'g', category: 'produce', defaultQty: 1000,
    words: ['apples', 'apple', 'seb', 'saib', 'सेब'],
    packs: [p('Fresh', 'Apple Shimla', 1000, 189), p('Fresh', 'Apple Royal Gala (4 pc)', 600, 169)] },
  { key: 'coriander', name: 'Coriander', emoji: '🌿', unit: 'g', category: 'produce', defaultQty: 100,
    words: ['coriander leaves', 'coriander', 'dhaniya', 'dhania', 'kothmir', 'धनिया'],
    packs: [p('Fresh', 'Coriander Leaves', 100, 14)] },
  { key: 'chilli', name: 'Green chilli', emoji: '🌶️', unit: 'g', category: 'produce', defaultQty: 100,
    words: ['green chillies', 'green chilli', 'hari mirch', 'mirchi', 'mirch', 'हरी मिर्च'],
    packs: [p('Fresh', 'Green Chilli', 100, 11)] },
  { key: 'ginger', name: 'Ginger', emoji: '🫚', unit: 'g', category: 'produce', defaultQty: 100,
    words: ['ginger', 'adrak', 'अदरक'],
    packs: [p('Fresh', 'Ginger', 100, 16), p('Fresh', 'Ginger', 250, 36)] },
  { key: 'garlic', name: 'Garlic', emoji: '🧄', unit: 'g', category: 'produce', defaultQty: 100,
    words: ['garlic', 'lehsun', 'lahsun', 'lasun', 'लहसुन'],
    packs: [p('Fresh', 'Garlic', 100, 24), p('Fresh', 'Garlic', 250, 55)] },
  { key: 'lemon', name: 'Lemon', emoji: '🍋', unit: 'pc', category: 'produce', defaultQty: 4,
    words: ['lemons', 'lemon', 'nimbu', 'neembu', 'नींबू'],
    packs: [p('Fresh', 'Lemon (4 pc)', 4, 25)] },
  { key: 'besan', name: 'Besan', emoji: '🟡', unit: 'g', category: 'staples', defaultQty: 500,
    words: ['gram flour', 'besan', 'बेसन'],
    packs: [p('Tata Sampann', 'Tata Sampann Besan', 500, 72, 85), p('Rajdhani', 'Rajdhani Besan', 1000, 129, 150)] },
  { key: 'poha', name: 'Poha', emoji: '🍚', unit: 'g', category: 'staples', defaultQty: 500,
    words: ['poha', 'chivda', 'पोहा'],
    packs: [p('Tata Sampann', 'Tata Sampann Poha', 500, 49, 60), p('bb Royal', 'bb Royal Poha Thick', 500, 39, 52)] },
  { key: 'turmeric', name: 'Turmeric powder', emoji: '🟠', unit: 'g', category: 'staples', defaultQty: 100,
    words: ['turmeric', 'haldi', 'हल्दी'],
    packs: [p('Everest', 'Everest Turmeric Powder', 100, 36), p('Tata Sampann', 'Tata Sampann Turmeric Powder', 200, 79)] },
  { key: 'jeera', name: 'Cumin (jeera)', emoji: '🌰', unit: 'g', category: 'staples', defaultQty: 100,
    words: ['cumin seeds', 'cumin', 'jeera', 'zeera', 'जीरा'],
    packs: [p('Catch', 'Catch Jeera Whole', 100, 82), p('bb Popular', 'bb Popular Jeera', 200, 149)] },
  { key: 'biscuits', name: 'Biscuits', emoji: '🍪', unit: 'pc', category: 'snacks', defaultQty: 1,
    words: ['parle g', 'parle-g', 'marie', 'biscuits', 'biscuit', 'बिस्कुट'],
    packs: [p('Parle', 'Parle-G Gold Biscuits 1 kg', 1, 135), p('Britannia', 'Britannia Marie Gold 250 g', 1, 40), p('Britannia', 'Britannia Good Day Cashew 200 g', 1, 45)] },
  { key: 'chips', name: 'Chips', emoji: '🥔', unit: 'pc', category: 'snacks', defaultQty: 2,
    words: ['lays', "lay's", 'chips', 'wafers'],
    packs: [p("Lay's", "Lay's Classic Salted 52 g", 1, 20), p('Bingo', 'Bingo Mad Angles 66 g', 1, 20)] },
  { key: 'coke', name: 'Cold drink', emoji: '🥤', unit: 'ml', category: 'beverages', defaultQty: 750,
    words: ['coca cola', 'coca-cola', 'cold drink', 'thums up', 'coke', 'pepsi', 'soft drink'],
    packs: [p('Coca-Cola', 'Coca-Cola Original', 750, 40), p('Thums Up', 'Thums Up', 750, 40), p('Coca-Cola', 'Coca-Cola Original', 2250, 99)] },
  { key: 'water', name: 'Packaged water', emoji: '💧', unit: 'ml', category: 'beverages', defaultQty: 1000,
    words: ['mineral water', 'water bottle', 'bisleri', 'paani', 'pani', 'water', 'पानी'],
    packs: [p('Bisleri', 'Bisleri Mineral Water', 1000, 20), p('Kinley', 'Kinley Water', 2000, 35)] },
  { key: 'detergent', name: 'Detergent', emoji: '🧺', unit: 'g', category: 'household', defaultQty: 1000,
    words: ['washing powder', 'detergent', 'surf', 'tide', 'sabun powder'],
    packs: [p('Surf Excel', 'Surf Excel Easy Wash', 1000, 145, 160), p('Tide', 'Tide Plus Double Power', 1000, 125, 140), p('Ariel', 'Ariel Complete', 1000, 299, 330)] },
  { key: 'dishwash', name: 'Dishwash', emoji: '🧽', unit: 'ml', category: 'household', defaultQty: 500,
    words: ['dishwash liquid', 'dishwash', 'vim', 'bartan sabun'],
    packs: [p('Vim', 'Vim Lemon Dishwash Liquid', 500, 115, 125), p('Pril', 'Pril Lime Dishwash Liquid', 425, 99, 110)] },
  { key: 'soap', name: 'Bath soap', emoji: '🧼', unit: 'pc', category: 'personal', defaultQty: 4,
    words: ['bath soap', 'soap', 'sabun', 'साबुन'],
    packs: [p('Lifebuoy', 'Lifebuoy Total 10 (4 × 100 g)', 4, 132), p('Dove', 'Dove Cream Beauty Bar (3 × 100 g)', 3, 189), p('Santoor', 'Santoor Sandal (4 × 100 g)', 4, 165)] },
  { key: 'toothpaste', name: 'Toothpaste', emoji: '🪥', unit: 'g', category: 'personal', defaultQty: 200,
    words: ['toothpaste', 'colgate', 'manjan', 'टूथपेस्ट'],
    packs: [p('Colgate', 'Colgate Strong Teeth', 200, 119, 136), p('Pepsodent', 'Pepsodent Germicheck', 150, 95, 110), p('Dabur', 'Dabur Red Paste', 200, 115, 130)] },
];

export const BRANDS = [...new Set(ITEMS.flatMap((i) => i.packs.map((x) => x.brand)).filter((b) => b !== 'Fresh'))].sort((a, b) => b.length - a.length);
export const itemByKey = new Map(ITEMS.map((i) => [i.key, i]));
