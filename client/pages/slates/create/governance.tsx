import * as React from 'react';
import styled from 'styled-components';
import { Formik, Form, FormikContext } from 'formik';
import { CircularProgress, withStyles } from '@material-ui/core';
import { toast } from 'react-toastify';
import clone from 'lodash/clone';

import { COLORS } from '../../../styles';
import Box from '../../../components/system/Box';
import Flex from '../../../components/system/Flex';
import { MainContext } from '../../../components/MainProvider';
import { EthereumContext, IEthereumContext } from '../../../components/EthereumProvider';
import Button from '../../../components/Button';
import Image from '../../../components/Image';
import Label from '../../../components/Label';
import Checkbox from '../../../components/Checkbox';
import CenteredTitle from '../../../components/CenteredTitle';
import CenteredWrapper from '../../../components/CenteredWrapper';
import FieldTextarea from '../../../components/FieldTextarea';
import FieldText, { ErrorMessage } from '../../../components/FieldText';
import Modal, { ModalTitle, ModalDescription } from '../../../components/Modal';
import { Separator } from '../../../components/Separator';
import SectionLabel from '../../../components/SectionLabel';
import { convertedToBaseUnits, formatPanvalaUnits } from '../../../utils/format';
import { ipfsAddObject } from '../../../utils/ipfs';
import { postSlate } from '../../../utils/api';
import {
  ISaveSlate,
  IMainContext,
  StatelessPage,
  IGovernanceSlateFormValues,
} from '../../../interfaces';
import ParametersForm from '../../../components/ParametersForm';
import {
  sendRecommendGovernanceSlateTx,
  sendCreateManyGovernanceProposals,
} from '../../../utils/transaction';
import { GovernanceSlateFormSchema } from '../../../utils/schemas';
import { IGovernanceProposalMetadata } from '../../../interfaces/contexts';
import { IParameterChangesObject } from '../../../interfaces/components';

const CreateGovernanceSlate: StatelessPage<any> = ({ classes }) => {
  // modal opener
  const [isOpen, setOpenModal] = React.useState(false);
  const { onRefreshSlates }: IMainContext = React.useContext(MainContext);
  // get eth context
  const {
    account,
    contracts,
    onRefreshBalances,
    slateStakeAmount,
  }: IEthereumContext = React.useContext(EthereumContext);
  // pending tx loader
  const [txPending, setTxPending] = React.useState(false);

  // Submit slate information to the Gatekeeper, saving metadata in IPFS
  async function handleSubmitSlate(values: IGovernanceSlateFormValues) {
    if (!account) {
      const msg =
        'To create a slate, you must first log into MetaMask and switch to the Rinkeby Test Network.';
      toast.error(msg);
      return;
    }

    // filter for only changes in parameters
    const parameterChanges: IParameterChangesObject = Object.keys(values.parameters).reduce(
      (acc, paramKey) => {
        let value = clone(values.parameters[paramKey]);
        if (!!value.newValue && value.newValue !== value.oldValue) {
          if (paramKey === 'slateStakeAmount') {
            value.newValue = convertedToBaseUnits(value.newValue, 18);
          }
          return {
            ...acc,
            [paramKey]: value,
          };
        }
        return acc;
      },
      {}
    );
    console.log('parameterChanges:', parameterChanges);

    // TODO: refactor id field. notifications expect it.
    const proposalMetadata: IGovernanceProposalMetadata = {
      id: Object.keys(parameterChanges).length,
      firstName: values.firstName,
      lastName: values.lastName,
      title: values.title,
      summary: values.summary,
      organization: values.organization,
      parameterChanges,
    };

    // save proposal metadata to IPFS to be included in the slate metadata
    console.log('preparing proposals...');
    let errorMessage = '';

    try {
      const multihash: string = await ipfsAddObject(proposalMetadata);
      // we need a buffer of the multihash for the transaction
      const proposalMultihash = Buffer.from(multihash);

      // 1. create proposal and get request ID
      const emptySlate = values.recommendation === 'noAction';
      const getRequests = emptySlate
        ? Promise.resolve([])
        : sendCreateManyGovernanceProposals(
            contracts.parameterStore,
            parameterChanges,
            proposalMultihash,
            setTxPending
          );

      errorMessage = 'error adding proposal metadata.';
      // console.log('creating proposals...');
      const requestIDs = await getRequests;

      // TODO: change the metadata format to include resource (but maybe include a human-readable resourceType)
      const slateMetadata: any = {
        ...proposalMetadata,
        requestIDs,
        category: contracts.parameterStore.address,
      };

      console.log('slateMetadata:', slateMetadata);

      errorMessage = 'error saving slate metadata.';
      console.log('saving slate metadata...');
      const slateMetadataHash: string = await ipfsAddObject(slateMetadata);

      // Submit the slate info to the contract
      errorMessage = 'error submitting slate.';
      const slate: any = await sendRecommendGovernanceSlateTx(
        contracts.gatekeeper,
        contracts.parameterStore.address,
        requestIDs,
        slateMetadataHash,
        setTxPending
      );
      console.log('Submitted slate', slate);

      // Add slate to db
      const slateToSave: ISaveSlate = {
        slateID: slate.slateID,
        metadataHash: slateMetadataHash,
        email: values.email,
      };

      errorMessage = 'problem saving slate info.';
      const response = await postSlate(slateToSave);
      if (response.status === 200) {
        console.log('Saved slate info');
        toast.success('Saved slate');
        if (values.stake === 'yes') {
          const res = await contracts.gatekeeper.functions.stakeTokens(slate.slateID);
          setTxPending(true);

          await res.wait();
          setTxPending(false);
        }

        setOpenModal(true);
        onRefreshSlates();
        onRefreshBalances();
      } else {
        throw new Error(`ERROR: failed to save slate: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      errorMessage = `ERROR: ${errorMessage}: ${error.message}`;
      console.error(errorMessage);
      toast.error(errorMessage);
      throw error;
    }

    // TODO: Should take us to all slates view after successful submission
  }

  return (
    <>
      <CenteredTitle title="Create a Governance Slate" />

      <CenteredWrapper>
        <Formik
          initialValues={{
            email: 'email@email.io',
            firstName: 'First',
            lastName: 'Last',
            organization: 'Ethereum',
            title: 'Change required stake',
            summary: 'fdsfdsfasdfadsfsad',
            parameters: {
              slateStakeAmount: {
                oldValue: '',
                newValue: '',
                type: 'uint256',
              },
              gatekeeperAddress: {
                oldValue: '',
                newValue: '',
                type: 'address',
              },
            },
            recommendation: 'governance',
            stake: 'no',
          }}
          validationSchema={GovernanceSlateFormSchema}
          onSubmit={async (values: IGovernanceSlateFormValues, { setSubmitting }: any) => {
            await handleSubmitSlate(values);
            // re-enable submit button
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, values, setFieldValue }: FormikContext<IGovernanceSlateFormValues>) => (
            <Form>
              <Box p={4}>
                <SectionLabel>{'ABOUT'}</SectionLabel>

                <FieldText required label={'Email'} name="email" placeholder="Enter your email" />
                <FieldText required label={'Slate Title'} name="title" placeholder="Enter title" />

                <FieldText
                  required
                  label={'First Name'}
                  name="firstName"
                  placeholder="Enter your first name"
                />
                <FieldText label={'Last Name'} name="lastName" placeholder="Enter your last name" />
                <FieldText
                  label={'Organization Name'}
                  name="organization"
                  placeholder="Enter your organization's name"
                />

                <FieldTextarea
                  required
                  label={'Description'}
                  name="summary"
                  placeholder="Enter a summary for your slate"
                />
              </Box>

              <Separator />
              <Box p={4}>
                <SectionLabel>{'RECOMMENDATION'}</SectionLabel>
                <Label htmlFor="recommendation" required>
                  {'What type of recommendation would you like to make?'}
                </Label>
                <ErrorMessage name="recommendation" component="span" />
                <div>
                  <Checkbox
                    name="recommendation"
                    value="governance"
                    label="Recommend governance proposals"
                  />
                  <Checkbox name="recommendation" value="noAction" label="Recommend no action" />
                </div>
                <div>
                  By recommending no action you are opposing any current or future slates for this
                  batch.
                </div>
              </Box>

              <Separator />
              <Box p={4}>
                <SectionLabel>{'PARAMETERS'}</SectionLabel>
                <ParametersForm
                  onChange={setFieldValue}
                  slateStakeAmount={formatPanvalaUnits(slateStakeAmount)}
                  newSlateStakeAmount={values.parameters.slateStakeAmount.newValue}
                  newGatekeeperAddress={values.parameters.gatekeeperAddress.newValue}
                  gatekeeperAddress={
                    contracts && contracts.gatekeeper && contracts.gatekeeper.address
                  }
                />

                <Separator />
                <Box p={4}>
                  <SectionLabel>STAKE</SectionLabel>
                  <Label htmlFor="stake" required>
                    {`Would you like to stake ${formatPanvalaUnits(
                      slateStakeAmount
                    )} tokens for this slate? This makes your slate eligible for the current batch.`}
                  </Label>
                  <ErrorMessage name="stake" component="span" />
                  <div>
                    <Checkbox name="stake" value="yes" label="Yes" />
                    <RadioSubText>
                      By selecting yes, you will stake tokens for your own slate and not have to
                      rely on others to stake tokens for you.
                    </RadioSubText>
                    <Checkbox name="stake" value="no" label="No" />
                    <RadioSubText>
                      By selecting no, you will have to wait for others to stake tokens for your
                      slate or you can stake tokens after you have created the slate.
                    </RadioSubText>
                  </div>
                </Box>
              </Box>

              <Separator />
              <Flex p={4} justifyEnd>
                <Button large>{'Back'}</Button>
                <Button type="submit" large primary disabled={isSubmitting}>
                  {'Create Slate'}
                </Button>
              </Flex>
            </Form>
          )}
        </Formik>
      </CenteredWrapper>

      <Modal handleClick={() => setOpenModal(false)} isOpen={txPending || isOpen}>
        {txPending ? (
          <>
            <Image src="/static/metamask-fox.svg" alt="metamask logo" />
            <ModalTitle>{'Transaction Processing'}</ModalTitle>
            <ModalDescription className="flex flex-wrap">
              Please wait a few moments while MetaMask processes your transaction. This will only
              take a few moments.
            </ModalDescription>
            <CircularProgress className={classes.progress} />
          </>
        ) : (
          <>
            <Image src="/static/check.svg" alt="slate submitted" />
            <ModalTitle>{'Slate submitted.'}</ModalTitle>
            <ModalDescription className="flex flex-wrap">
              Now that your slate has been created you and others have the ability to stake tokens
              on it to propose it to token holders. Once there are tokens staked on the slate it
              will be eligible for a vote.
            </ModalDescription>
            <Button
              type="default"
              onClick={() => {
                setOpenModal(false);
              }}
            >
              {'Done'}
            </Button>
          </>
        )}
      </Modal>
    </>
  );
};

const RadioSubText = styled.div`
  margin-left: 2.5rem;
  font-size: 0.75rem;
  color: ${COLORS.grey3};
`;

CreateGovernanceSlate.getInitialProps = async ({ query, classes }) => {
  return { query, classes };
};
const styles = (theme: any) => ({
  progress: {
    margin: theme.spacing.unit * 2,
    color: COLORS.primary,
  },
});

export default withStyles(styles)(CreateGovernanceSlate);
