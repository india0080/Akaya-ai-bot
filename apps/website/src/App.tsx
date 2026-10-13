import { Layout } from './components/layout/Layout';
import { resolveRoute } from './routes';

export function App({ path }: { path: string }) {
  return <Layout path={path}>{resolveRoute(path).element}</Layout>;
}
