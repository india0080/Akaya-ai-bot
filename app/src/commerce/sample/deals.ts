/** SAMPLE deals for the demo (sample prices). "Buy on X" opens the store's real search for the product. */

export type DealCategory = 'electronics' | 'fashion' | 'beauty' | 'home';

export interface SampleDeal {
  id: string;
  title: string;
  platform: string;
  category: DealCategory;
  price: number;
  mrp: number;
  rating: number;
  emoji: string;
  /** search query used for the store link */
  q: string;
}

export const DEAL_CATEGORIES: { id: DealCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'home', label: 'Home' },
];

export const DEALS: SampleDeal[] = [
  {
    id: 'd1',
    title: 'boAt Rockerz 450 Bluetooth headphones',
    platform: 'amazon',
    category: 'electronics',
    price: 1499,
    mrp: 3990,
    rating: 4.1,
    emoji: '🎧',
    q: 'boAt Rockerz 450',
  },
  {
    id: 'd2',
    title: 'Redmi 13C 5G (4 GB / 128 GB)',
    platform: 'flipkart',
    category: 'electronics',
    price: 9499,
    mrp: 13999,
    rating: 4.2,
    emoji: '📱',
    q: 'Redmi 13C 5G',
  },
  {
    id: 'd3',
    title: "Levi's 511 slim fit jeans",
    platform: 'myntra',
    category: 'fashion',
    price: 1799,
    mrp: 3599,
    rating: 4.3,
    emoji: '👖',
    q: 'levis 511 slim jeans',
  },
  {
    id: 'd4',
    title: 'Puma Smash v2 sneakers',
    platform: 'ajio',
    category: 'fashion',
    price: 2199,
    mrp: 4999,
    rating: 4.2,
    emoji: '👟',
    q: 'puma smash v2',
  },
  {
    id: 'd5',
    title: 'Lakmé 9to5 primer + matte foundation',
    platform: 'nykaa',
    category: 'beauty',
    price: 399,
    mrp: 650,
    rating: 4.4,
    emoji: '💄',
    q: 'lakme 9to5 primer matte',
  },
  {
    id: 'd6',
    title: 'Philips 4.1 L air fryer',
    platform: 'croma',
    category: 'home',
    price: 6999,
    mrp: 9995,
    rating: 4.4,
    emoji: '🍟',
    q: 'philips air fryer',
  },
  {
    id: 'd7',
    title: 'Prestige Iris 750 W mixer grinder',
    platform: 'tatacliq',
    category: 'home',
    price: 3149,
    mrp: 5795,
    rating: 4.1,
    emoji: '🥤',
    q: 'prestige iris mixer grinder',
  },
];

/** stores offered for a quick product search */
export const SHOP_STORES = ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'croma', 'tatacliq'];

export const pctOff = (d: Pick<SampleDeal, 'price' | 'mrp'>) => Math.round((1 - d.price / d.mrp) * 100);
