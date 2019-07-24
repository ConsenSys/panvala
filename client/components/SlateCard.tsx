import * as React from 'react';
import Card from './Card';
import RouterLink from './RouterLink';
import { convertEVMSlateStatus } from '../utils/status';
import { SLATE } from '../utils/constants';

export default function SlateCard({ slate, subtitle }) {
  return (
    <RouterLink href={`/slates/slate?id=${slate.id}`} as={`/slates/${slate.id}`} key={slate.id}>
      <Card
        key={slate.id}
        subtitle={subtitle}
        description={slate.description}
        category={slate.category}
        status={convertEVMSlateStatus(slate.status)}
        address={slate.recommender}
        recommender={slate.organization}
        verifiedRecommender={slate.verifiedRecommender}
        type={SLATE}
        incumbent={slate.incumbent}
        width={['98%', '98%', '47%', '47%', '32%']}
      />
    </RouterLink>
  );
}
