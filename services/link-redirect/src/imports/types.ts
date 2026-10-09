import type { EarningRow } from '@akaya/affiliate';

export interface DateRange {
  from: string;
  to: string;
}

/** One affiliate programme / network: CSV export parser + (stub) reporting-API pull. */
export interface ImportAdapter {
  source: string;
  label: string;
  /** where to download the CSV in the partner dashboard */
  csvHelp: string;
  /** env vars the API pull needs (empty when the programme is CSV-only) */
  apiEnv: string[];
  parseCsv(csv: string): EarningRow[];
  /** STUB: pull from the network's reporting API. Throws NotConfigured until the env vars are set. */
  fetchApi(env: NodeJS.ProcessEnv, range: DateRange): Promise<EarningRow[]>;
}

export class NotConfigured extends Error {
  constructor(
    readonly source: string,
    readonly missing: string[],
    message = `${source}: set ${missing.join(', ')} to enable the API import`,
  ) {
    super(message);
  }
}

/** shared stub for API pulls: checks env, then explains what is left to wire up */
export function apiStub(source: string, apiEnv: string[], docs: string | null) {
  return async (env: NodeJS.ProcessEnv): Promise<EarningRow[]> => {
    if (!docs) throw new NotConfigured(source, [], `${source} has no public earnings API: upload the CSV export`);
    const missing = apiEnv.filter((k) => !env[k]);
    if (missing.length) throw new NotConfigured(source, missing);
    // TODO(affiliate-api): call the reporting API documented at `docs`, map rows with the CSV mapper's logic.
    throw new Error(`${source}: API import not implemented yet (see ${docs}); upload the CSV export instead`);
  };
}
