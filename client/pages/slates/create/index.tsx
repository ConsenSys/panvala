import * as React from 'react';
import { toast } from 'react-toastify';

import Box from '../../../components/system/Box';
import CenteredTitle from '../../../components/CenteredTitle';
import CenteredWrapper from '../../../components/CenteredWrapper';
import FieldSelect from '../../../components/FieldSelect';
import SectionLabel from '../../../components/SectionLabel';
import RouteActions from '../../../components/RouteActions';
import { Separator } from '../../../components/Separator';
import { MainContext } from '../../../components/MainProvider';
import { isSlateSubmittable } from '../../../utils/status';

const CreateSlate: React.SFC = () => {
  const [category, setCategory] = React.useState('');
  const { currentBallot } = React.useContext(MainContext);
  const [createable, setCreateable] = React.useState(false);

  function categoryOpen(cat: string) {
    return isSlateSubmittable(currentBallot, cat.toUpperCase());
  }

  React.useEffect(() => {
    if (categoryOpen(category)) {
      setCreateable(true);
    } else {
      setCreateable(false);
    }
  }, [currentBallot.slateSubmissionDeadline, category]);

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
            handleChange={(e: any) => {
              const category = e.target.value;
              setCategory(category);

              // If a category has been selected and submission is closed, show a message
              if (category !== '' && !categoryOpen(category)) {
                toast.error(`${category} submission deadline has passed`);
              }
            }}
            value={category}
          />
        </Box>

        <Separator />
        <RouteActions
          href={`/slates/create/${category}`}
          as={`/slates/create/${category}`}
          text="Begin"
          disabled={!category || !createable}
        />
      </CenteredWrapper>
    </>
  );
};

export default CreateSlate;
