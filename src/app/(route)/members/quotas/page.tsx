import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { CotasPagasPage } from './cotas-pagas-page';

export default function CotasPagasRoutePage() {
  return (
    <ListView>
      <ListViewHeader title="Quotas pagas" />
      <CotasPagasPage />
    </ListView>
  );
}
