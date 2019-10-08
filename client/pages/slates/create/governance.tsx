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
import FieldText from '../../../components/FieldText';
import { ErrorMessage } from '../../../components/FormError';
import Modal, { ModalTitle, ModalDescription } from '../../../components/Modal';
import { Separator } from '../../../components/Separator';
import SectionLabel from '../../../components/SectionLabel';
import { convertedToBaseUnits, formatPanvalaUnits, getAddress } from '../../../utils/format';
import { postSlate, saveToIpfs } from '../../../utils/api';
import { handleGenericError, ETHEREUM_NOT_AVAILABLE } from '../../../utils/errors';
import {
  ISaveSlate,
  StatelessPage,
  IGovernanceSlateFormValues,
  IGovernanceProposalMetadata,
  IGovernanceProposalInfo,
  IParameterChangesObject,
  ISlateMetadata,
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
import { MaxUint256 } from 'ethers/constants';
import ClosedSlateSubmission from '../../../components/ClosedSlateSubmission';

enum PageStatus {
  Loading,
  Initialized,
  SubmissionOpen,
  SubmissionClosed,
}

interface IGovernanceSlateMetadataV1 {
  firstName: string;
  lastName?: string;
  organization?: string;
  summary: string;
  requestIDs: string[];
  resource: string;
}


// Match the general slate metadata format
interface IGovernanceSlateMetadataV2 extends ISlateMetadata {}

const CreateGovernanceSlate: StatelessPage<any> = () => {
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
  const [pendingText, setPendingText] = React.useState('');
  const [pageStatus, setPageStatus] = React.useState(PageStatus.Loading);
  const [deadline, setDeadline] = React.useState(0);

  // parameters
  const initialParameters = {
    slateStakeAmount: {
      parameterName: 'Slate Stake Amount',
      oldValue: slateStakeAmount.toString(),
      newValue: '',
      type: 'uint256',
      key: 'slateStakeAmount',
    },
    gatekeeperAddress: {
      parameterName: 'Gatekeeper Address',
      oldValue: contracts.gatekeeper.address,
      newValue: '',
      type: 'address',
      key: 'gatekeeperAddress',
    },
  };

  // Update page status when ballot info changes
  React.useEffect(() => {
    const newDeadline = currentBallot.slateSubmissionDeadline.GOVERNANCE;
    setDeadline(newDeadline);

    if (pageStatus === PageStatus.Loading) {
      if (newDeadline === 0) return;

      setPageStatus(PageStatus.Initialized);
    } else {
      if (!isSlateSubmittable(currentBallot, 'GOVERNANCE')) {
        setPageStatus(PageStatus.SubmissionClosed);
        // if (typeof router !== 'undefined') {
        //   router.push('/slates');
        // }
      } else {
        setPageStatus(PageStatus.SubmissionOpen);
      }
    }
  }, [currentBallot.slateSubmissionDeadline, pageStatus]);

  // pending tx loader
  const [txsPending, setTxsPending] = React.useState(0);

  function calculateNumTxs(values) {
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

  // Condense to the bare parameter changes
  function filterParameterChanges(
    formParameters: IParameterChangesObject
  ): IParameterChangesObject {
    return Object.keys(formParameters).reduce((acc, paramKey) => {
      let value = clone(formParameters[paramKey]);
      if (!!value.newValue) {
        // Convert values if necessary first before checking equality
        if (paramKey === 'slateStakeAmount') {
          // Convert token amount
          value.newValue = convertedToBaseUnits(value.newValue, 18);
        } else if (value.type === 'address') {
          // Normalize address
          value.oldValue = getAddress(value.oldValue);
          value.newValue = getAddress(value.newValue.toLowerCase());
        }

        // if something has changed, add it
        if (value.newValue !== value.oldValue) {
          return {
            ...acc,
            [paramKey]: value,
          };
        }
      }

      return acc;
    }, {});
  }

  // Submit slate information to the Gatekeeper, saving metadata in IPFS
  async function handleSubmitSlate(
    values: IGovernanceSlateFormValues,
    parameterChanges: IParameterChangesObject
  ) {
    console.log('parameterChanges:', parameterChanges);

    let errorMessage = '';

    try {
      if (!account) {
        throw new Error(ETHEREUM_NOT_AVAILABLE);
      }

      const numTxs = calculateNumTxs(values);
      setTxsPending(numTxs);
      setPendingText('Adding proposals to IPFS...');

      const paramKeys = Object.keys(parameterChanges);

      const proposalMetadatas: IGovernanceProposalMetadata[] = paramKeys.map((param: string): IGovernanceProposalMetadata => {
        const { oldValue, newValue, type, key } = parameterChanges[param];

        return {
          firstName: values.firstName,
          lastName: values.lastName,
          summary: values.summary,
          organization: values.organization,
          parameterChanges: {
            key,
            oldValue,
            newValue,
            type,
          },
        };
      });

      const proposalMultihashes: Buffer[] = await Promise.all(
        proposalMetadatas.map(async (metadata: IGovernanceProposalMetadata) => {
          try {
            const multihash: string = await saveToIpfs(metadata);
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

      setPendingText('Including proposals in slate (check MetaMask)...');
      // 1. create proposal and get request ID
      const emptySlate = values.recommendation === 'noAction';
      const getRequests = emptySlate
        ? Promise.resolve([])
        : sendCreateManyGovernanceProposals(contracts.parameterStore, proposalInfo);

      errorMessage = 'error adding proposal metadata.';
      // console.log('creating proposals...');
      const requestIDs = await getRequests;

      setPendingText('Adding slate to IPFS...');
      const resource = contracts.parameterStore.address;

      const slateMetadata: IGovernanceSlateMetadataV2 = {
        firstName: values.firstName,
        lastName: values.lastName,
        description: values.summary,
        organization: values.organization,
        proposalMultihashes: proposalMultihashes.map(md => md.toString()),
        proposals: proposalMetadatas,
      };

      console.log('slateMetadata:', slateMetadata);

      errorMessage = 'error saving slate metadata.';
      console.log('saving slate metadata...');
      const slateMetadataHash: string = await saveToIpfs(slateMetadata);

      setPendingText('Creating governance slate (check MetaMask)...');
      // Submit the slate info to the contract
      errorMessage = 'error submitting slate.';
      const slate: any = await sendRecommendGovernanceSlateTx(
        contracts.gatekeeper,
        resource,
        requestIDs,
        slateMetadataHash
      );
      console.log('Submitted slate', slate);

      setPendingText('Saving slate...');
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
          if (gkAllowance.lt(slateStakeAmount)) {
            setPendingText('Approving the Gatekeeper to stake on slate (check MetaMask)...');
            await contracts.token.approve(contracts.gatekeeper.address, MaxUint256);
          }
          setPendingText('Staking on slate (check MetaMask)...');
          const res = await contracts.gatekeeper.functions.stakeTokens(slate.slateID);
          await res.wait();
        }

        setTxsPending(0);
        setPendingText('');
        setOpenModal(true);
        onRefreshSlates();
        onRefreshCurrentBallot();
        onRefreshBalances();
      } else {
        throw new Error(`ERROR: failed to save slate: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      errorMessage = `ERROR: ${errorMessage}: ${error.message}`;
      handleSubmissionError(errorMessage, error);
    }

    // TODO: Should take us to all slates view after successful submission
  }

  function handleSubmissionError(errorMessage, error) {
    // Reset view
    setOpenModal(false);
    setTxsPending(0);

    // Show a message
    const errorType = handleGenericError(error, toast);
    if (errorType) {
      toast.error(`Problem submitting slate: ${errorMessage}`);
    }

    console.error(error);
  }

  if (pageStatus === PageStatus.Loading || pageStatus === PageStatus.Initialized) {
    return <div>Loading...</div>;
  }

  return pageStatus === PageStatus.SubmissionOpen ? (
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
                  parameters: initialParameters,
                  recommendation: 'governance',
                  stake: 'no',
                }
              : {
                  email: '',
                  firstName: '',
                  lastName: '',
                  organization: '',
                  summary: '',
                  parameters: initialParameters,
                  recommendation: 'governance',
                  stake: 'no',
                }
          }
          validationSchema={GovernanceSlateFormSchema}
          onSubmit={async (
            values: IGovernanceSlateFormValues,
            { setSubmitting, setFieldError }: any
          ) => {
            const emptySlate = values.recommendation === 'noAction';

            if (emptySlate) {
              // Submit with no changes if the user selected noAction
              const noChanges: IParameterChangesObject = {};
              await handleSubmitSlate(values, noChanges);
            } else {
              try {
                const changes: IParameterChangesObject = filterParameterChanges(values.parameters);
                if (Object.keys(changes).length === 0) {
                  setFieldError('parametersForm', 'You must enter some parameter values different from the old ones');
                } else {
                  await handleSubmitSlate(values, changes);
                }
              } catch (error) {
                // some issue with filtering the changes - should never get here
                const errorType = handleGenericError(error, toast);
                if (errorType) {
                  toast.error(`Problem submitting slate: ${error.message}`);
                }
                console.error(error);
              }
            }

            // re-enable submit button
            setSubmitting(false);
          }}
        >
          {({
            isSubmitting,
            values,
            setFieldValue,
            handleSubmit,
            errors,
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
                  {values.recommendation === 'governance' && (
                    <>
                      <SectionLabel>{'PARAMETERS'}</SectionLabel>
                      <ParametersForm
                        onChange={setFieldValue}
                        parameters={values.parameters}
                        errors={errors}
                      />
                    </>
                  )}

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

      <Loader
        isOpen={txsPending > 0}
        setOpen={() => setTxsPending(0)}
        numTxs={txsPending}
        pendingText={pendingText}
      />

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
  ) : (
    <ClosedSlateSubmission deadline={deadline} category={'governance'} />
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
