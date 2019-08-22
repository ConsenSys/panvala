import * as React from 'react';
import styled from 'styled-components';
import { Formik, Form, FormikContext } from 'formik';
import { withStyles } from '@material-ui/core';
import { toast } from 'react-toastify';
import clone from 'lodash/clone';
import { withRouter } from 'next/router';

import { COLORS } from '../../../styles';
import Box from '../../../components/system/Box';
import Flex from '../../../components/system/Flex';
import { MainContext, IMainContext } from '../../../components/MainProvider';
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
  StatelessPage,
  IGovernanceSlateFormValues,
  IGovernanceProposalMetadata,
  IGovernanceProposalInfo,
  IParameterChangesObject,
} from '../../../interfaces';
import ParametersForm from '../../../components/ParametersForm';
import {
  sendRecommendGovernanceSlateTx,
  sendCreateManyGovernanceProposals,
} from '../../../utils/transaction';
import { GovernanceSlateFormSchema } from '../../../utils/schemas';
import RouterLink from '../../../components/RouterLink';
import BackButton from '../../../components/BackButton';
import { isSlateSubmittable } from '../../../utils/status';
import Loader from '../../../components/Loader';

const CreateGovernanceSlate: StatelessPage<any> = ({ classes, router }) => {
  // modal opener
  const [isOpen, setOpenModal] = React.useState(false);
  const { onRefreshSlates, onRefreshCurrentBallot, currentBallot }: IMainContext = React.useContext(
    MainContext
  );
  // get eth context
  const {
    account,
    contracts,
    onRefreshBalances,
    slateStakeAmount,
    gkAllowance,
  }: IEthereumContext = React.useContext(EthereumContext);

  React.useEffect(() => {
    if (!isSlateSubmittable(currentBallot, 'GOVERNANCE')) {
      toast.error('Governance slate submission deadline has passed');
      router.push('/slates');
    }
  }, [currentBallot.slateSubmissionDeadline]);

  // pending tx loader
  const [txsPending, setTxsPending] = React.useState(0);

  async function calculateNumTxs(values) {
    let numTxs: number = 1; // gk.recommendSlate

    if (values.recommendation === 'governance') {
      numTxs += 1; // ps.createManyProposals
    }

    if (values.stake === 'yes') {
      numTxs += 1; // gk.stakeSlate
      if (gkAllowance.lt(slateStakeAmount)) {
        numTxs += 1; // token.approve
      }
    }

    return numTxs;
  }

  // Submit slate information to the Gatekeeper, saving metadata in IPFS
  async function handleSubmitSlate(values: IGovernanceSlateFormValues) {
    if (!account) {
      const msg =
        'To create a slate, you must first log into MetaMask and switch to the Rinkeby Test Network.';
      toast.error(msg);
      return;
    }
    const numTxs = await calculateNumTxs(values);
    setTxsPending(numTxs);

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
    const paramKeys = Object.keys(parameterChanges);

    const proposalMetadatas: IGovernanceProposalMetadata[] = paramKeys.map((param: string) => {
      return {
        id: Object.keys(parameterChanges).length,
        firstName: values.firstName,
        lastName: values.lastName,
        summary: values.summary,
        organization: values.organization,
        parameterChanges: {
          ...parameterChanges[param],
        },
      };
    });
    const proposalMultihashes: Buffer[] = await Promise.all(
      proposalMetadatas.map(async (metadata: IGovernanceProposalMetadata) => {
        try {
          const multihash: string = await ipfsAddObject(metadata);
          // we need a buffer of the multihash for the transaction
          return Buffer.from(multihash);
        } catch (error) {
          return error;
        }
      })
    );
    const proposalInfo: IGovernanceProposalInfo = {
      metadatas: proposalMetadatas,
      multihashes: proposalMultihashes,
    };

    // save proposal metadata to IPFS to be included in the slate metadata
    console.log('preparing proposals...');
    let errorMessage = '';

    try {
      // 1. create proposal and get request ID
      const emptySlate = values.recommendation === 'noAction';
      const getRequests = emptySlate
        ? Promise.resolve([])
        : sendCreateManyGovernanceProposals(contracts.parameterStore, proposalInfo);

      errorMessage = 'error adding proposal metadata.';
      // console.log('creating proposals...');
      const requestIDs = await getRequests;

      // TODO: change the metadata format to include resource (but maybe include a human-readable resourceType)
      const slateMetadata: any = {
        firstName: values.firstName,
        lastName: values.lastName,
        summary: values.summary,
        organization: values.organization,
        requestIDs,
        resource: contracts.parameterStore.address,
      };

      console.log('slateMetadata:', slateMetadata);

      errorMessage = 'error saving slate metadata.';
      console.log('saving slate metadata...');
      const slateMetadataHash: string = await ipfsAddObject(slateMetadata);

      // Submit the slate info to the contract
      errorMessage = 'error submitting slate.';
      const slate: any = await sendRecommendGovernanceSlateTx(
        contracts.gatekeeper,
        slateMetadata.resource,
        requestIDs,
        slateMetadataHash
      );
      console.log('Submitted slate', slate);

      // Add slate to db
      const slateToSave: ISaveSlate = {
        slateID: slate.slateID,
        metadataHash: slateMetadataHash,
        email: values.email,
        proposalInfo,
      };

      errorMessage = 'problem saving slate info.';
      const response = await postSlate(slateToSave);
      if (response.status === 200) {
        console.log('Saved slate info');
        toast.success('Saved slate');
        if (values.stake === 'yes') {
          const res = await contracts.gatekeeper.functions.stakeTokens(slate.slateID);

          await res.wait();
        }

        setTxsPending(0);
        setOpenModal(true);
        onRefreshSlates();
        onRefreshCurrentBallot();
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
          initialValues={
            process.env.NODE_ENV === 'development'
              ? {
                  email: 'email@email.io',
                  firstName: 'First',
                  lastName: 'Last',
                  organization: 'Ethereum',
                  summary: 'fdsfdsfasdfadsfsad',
                  parameters: {
                    slateStakeAmount: {
                      oldValue: '',
                      newValue: '',
                      type: 'uint256',
                      key: 'slateStakeAmount',
                    },
                    gatekeeperAddress: {
                      oldValue: '',
                      newValue: '',
                      type: 'address',
                      key: 'gatekeeperAddress',
                    },
                  },
                  recommendation: 'governance',
                  stake: 'no',
                }
              : {
                  email: '',
                  firstName: '',
                  lastName: '',
                  organization: '',
                  summary: '',
                  parameters: {
                    slateStakeAmount: {
                      oldValue: '',
                      newValue: '',
                      type: 'uint256',
                      key: 'slateStakeAmount',
                    },
                    gatekeeperAddress: {
                      oldValue: '',
                      newValue: '',
                      type: 'address',
                      key: 'gatekeeperAddress',
                    },
                  },
                  recommendation: 'governance',
                  stake: 'no',
                }
          }
          validationSchema={GovernanceSlateFormSchema}
          onSubmit={async (values: IGovernanceSlateFormValues, { setSubmitting }: any) => {
            await handleSubmitSlate(values);
            // re-enable submit button
            setSubmitting(false);
          }}
        >
          {({
            isSubmitting,
            values,
            setFieldValue,
            handleSubmit,
          }: FormikContext<IGovernanceSlateFormValues>) => (
            <Box>
              <Form>
                <Box p={4}>
                  <SectionLabel>{'ABOUT'}</SectionLabel>

                  <FieldText required label={'Email'} name="email" placeholder="Enter your email" />

                  <FieldText
                    required
                    label={'First Name'}
                    name="firstName"
                    placeholder="Enter your first name"
                  />
                  <FieldText
                    label={'Last Name'}
                    name="lastName"
                    placeholder="Enter your last name"
                  />
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
              </Form>

              <Flex p={4} justifyEnd>
                <BackButton />
                <Button type="submit" large primary disabled={isSubmitting} onClick={handleSubmit}>
                  {'Create Slate'}
                </Button>
              </Flex>
            </Box>
          )}
        </Formik>
      </CenteredWrapper>

      <Loader isOpen={txsPending > 0} setOpen={() => setTxsPending(0)} numTxs={txsPending} />

      <Modal handleClick={() => setOpenModal(false)} isOpen={isOpen}>
        <>
          <Image src="/static/check.svg" alt="slate submitted" width="80px" />
          <ModalTitle>{'Slate submitted.'}</ModalTitle>
          <ModalDescription>
            Now that your slate has been created you and others have the ability to stake tokens on
            it to propose it to token holders. Once there are tokens staked on the slate it will be
            eligible for a vote.
          </ModalDescription>
          <RouterLink href="/slates" as="/slates">
            <Button type="default">{'Done'}</Button>
          </RouterLink>
        </>
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
    margin: theme.spacing(2),
    color: COLORS.primary,
  },
});

export default withStyles(styles)(withRouter(CreateGovernanceSlate));
