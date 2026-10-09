/**
 * Partner adapter: the store's OFFICIAL MCP server, called on behalf of the signed-in user (OAuth).
 *  - Swiggy Instamart MCP: https://mcp.swiggy.com/im  (OAuth 2.1 + PKCE, 5-day tokens; production
 *    access is invite/review based: https://mcp.swiggy.com/builders/docs/operate/access.md)
 *  - Zepto MCP: https://mcp.zepto.co.in/mcp  (consumer OAuth; orders placed there are REAL orders)
 *
 * Status: SKELETON, not run against the live servers. The transport + guard are written; the
 * response mapping is TODO because tool result shapes must be checked against staging.
 *
 * HARD RULE: these servers also expose checkout / payment tools. Akaya must never call them. Every
 * call goes through `call()`, which only permits the allowlisted search/cart tools below.
 */
import type { Config } from '../../config.js';
import { STORES, type Fees, type ParsedItem, type Sku, type StoreId } from '../../types.js';
import { PROFILES } from '../mock.js';
import { ProviderNotConfiguredError, type CartLineInput, type FillProgress, type FillResult, type GroceryProvider, type Serviceability } from '../types.js';

export interface McpFlow {
  store: StoreId;
  urlKey: keyof Config;
  tokenKey: keyof Config;
  /** tool names used by this adapter (must all be in `allow`) */
  tools: { search: string; getCart: string; updateCart: string; addresses?: string };
  /** the ONLY tools this adapter may call */
  allow: string[];
}

/** Tool names that must never be called, whatever a server advertises. */
export const BLOCKED_TOOL = /checkout|place|confirm|pay|coupon/i;

export class ToolNotAllowedError extends Error {
  constructor(tool: string) {
    super(`Akaya does not call "${tool}": checkout and payment stay with the user in the store app`);
  }
}

export class McpStoreProvider implements GroceryProvider {
  id: string;
  label: string;
  kind = 'partner' as const;
  setupHint: string;
  readonly store: StoreId;
  constructor(
    readonly flow: McpFlow,
    private cfg: Config,
  ) {
    this.store = flow.store;
    this.id = `mcp:${flow.store}`;
    this.label = `${STORES[flow.store].name} (official MCP · your account)`;
    this.setupHint = `${String(flow.tokenKey)}=<OAuth access token for the user> (see docs/PROVIDERS.md)`;
  }
  configured() {
    return !!this.cfg[this.flow.tokenKey];
  }

  /** The guard: allowlist + blocklist. Exposed for tests. */
  assertAllowed(tool: string) {
    if (!this.flow.allow.includes(tool) || BLOCKED_TOOL.test(tool)) throw new ToolNotAllowedError(tool);
  }

  private async call(tool: string, args: Record<string, unknown>): Promise<unknown> {
    this.assertAllowed(tool);
    if (!this.configured()) throw new ProviderNotConfiguredError(this.id, this.setupHint);
    // Optional dependency: npm --prefix backend i @modelcontextprotocol/sdk
    const sdk = await import(/* @vite-ignore */ '@modelcontextprotocol/sdk/client/index.js' as string).catch(() => null);
    const http = await import(/* @vite-ignore */ '@modelcontextprotocol/sdk/client/streamableHttp.js' as string).catch(() => null);
    if (!sdk || !http) throw new Error('MCP SDK not installed: npm --prefix backend i @modelcontextprotocol/sdk');
    const client = new sdk.Client({ name: 'akaya-grocery-agent', version: '0.1.0' });
    const transport = new http.StreamableHTTPClientTransport(new URL(String(this.cfg[this.flow.urlKey])), {
      requestInit: { headers: { authorization: `Bearer ${String(this.cfg[this.flow.tokenKey])}` } },
    });
    await client.connect(transport);
    try {
      return await client.callTool({ name: tool, arguments: args });
    } finally {
      await client.close();
    }
  }

  async serviceability(): Promise<Serviceability> {
    // TODO(mcp): read ETA from search/cart results for the user's selected address.
    const p = PROFILES[this.store];
    return { serviceable: this.configured(), etaMin: Array.isArray(p.eta) ? p.eta[1] : 30, etaLabel: 'from store (TODO)' };
  }

  async findSkus(items: ParsedItem[]): Promise<Sku[]> {
    const out: Sku[] = [];
    for (const item of items) {
      const res = await this.call(this.flow.tools.search, { query: [item.brand, item.name].filter(Boolean).join(' ') });
      // TODO(mcp): map product variants (pack size, price, MRP, stock) in `res` to Sku[] with itemKey = item.key.
      void res;
    }
    if (!out.length) throw new Error(`TODO(mcp:${this.store}): map ${this.flow.tools.search} results to SKUs`);
    return out;
  }

  fees(subtotal: number): Fees {
    // TODO(mcp): use the bill breakdown from get_cart; until then reuse the sample fee rules.
    const f = PROFILES[this.store].fee;
    return { delivery: subtotal >= f.freeAbove ? 0 : f.delivery, handling: f.handling, smallCart: subtotal < f.smallCartBelow ? f.smallCart : 0, platform: f.platform };
  }
  getSku() {
    return undefined;
  }

  async fillCart(lines: CartLineInput[], ctx: { onProgress?: (p: FillProgress) => void } = {}): Promise<FillResult> {
    ctx.onProgress?.({ store: this.store, step: 'opening', message: `Updating your ${STORES[this.store].name} cart` });
    // Instamart's update_cart replaces the whole cart with the provided items.
    await this.call(this.flow.tools.updateCart, { items: lines.map((l) => ({ id: l.skuId, quantity: l.packs })) }); // TODO(mcp): exact arg shape
    ctx.onProgress?.({ store: this.store, step: 'verifying', message: 'Reading the cart total back' });
    const cart = await this.call(this.flow.tools.getCart, {});
    void cart; // TODO(mcp): read the bill total from `cart` into verifiedTotal
    ctx.onProgress?.({ store: this.store, step: 'ready' });
    // STOP HERE. Never call checkout / payment tools; the user pays in the store app.
    throw new Error(`TODO(mcp:${this.store}): map get_cart response to FillResult`);
  }
}

export const instamartMcp: McpFlow = {
  store: 'instamart',
  urlKey: 'INSTAMART_MCP_URL',
  tokenKey: 'INSTAMART_MCP_TOKEN',
  tools: { search: 'search_products', getCart: 'get_cart', updateCart: 'update_cart', addresses: 'get_addresses' },
  allow: ['get_addresses', 'search_products', 'your_go_to_items', 'get_cart', 'update_cart', 'clear_cart', 'track_order', 'get_delivery_status'],
};
/** Zepto's tool names are not documented publicly; discover them with tools/list on first connect. */
export const zeptoMcp: McpFlow = {
  store: 'zepto',
  urlKey: 'ZEPTO_MCP_URL',
  tokenKey: 'ZEPTO_MCP_TOKEN',
  tools: { search: 'TODO_search_tool', getCart: 'TODO_get_cart_tool', updateCart: 'TODO_update_cart_tool' },
  allow: [],
};
