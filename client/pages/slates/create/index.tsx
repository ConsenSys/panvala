import * as React from 'react';

import Box from '../../../components/system/Box';
import CenteredTitle from '../../../components/CenteredTitle';
import CenteredWrapper from '../../../components/CenteredWrapper';
import FieldSelect from '../../../components/FieldSelect';
import SectionLabel from '../../../components/SectionLabel';
import RouteActions from '../../../components/RouteActions';
import { Separator } from '../../../components/Separator';

const CreateSlate: React.SFC = () => {
  const [category, setCategory] = React.useState('');
  return (
    <>
      <CenteredTitle title="Create a Slate" />

      <CenteredWrapper>
        <Box px={5} py={4}>
          <SectionLabel>{'SLATE TYPE'}</SectionLabel>
          <FieldSelect
            required
            label={'Select the type of slate you would like to create'}
            name="category"
            placeholder="Select slate category"
            handleChange={(e: any) => setCategory(e.target.value)}
            value={category}
          />
        </Box>

        <Separator />
        <RouteActions
          href={`/slates/create/${category}`}
          as={`/slates/create/${category}`}
          text="Begin"
          disabled={!category}
        />
      </CenteredWrapper>
    </>
  );
};

export default CreateSlate;
