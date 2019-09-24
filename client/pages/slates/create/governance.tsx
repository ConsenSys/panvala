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
import { convertedToBaseUnits, formatPanvalaUnits } from '../../../utils/format';
import { ipfsAddObject } from '../../../utils/ipfs';
import { postSlate } from '../../../utils/api';
import { handleGenericError, ETHEREUM_NOT_AVAILABLE } from '../../../utils/errors';
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
import { MaxUint256 } from 'ethers/constants';

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
  const [pendingText, setPendingText] = React.useState('');

  React.useEffect(() => {
    if (!isSlateSubmittable(currentBallot, 'GOVERNANCE')) {
      toast.error('Governance slate submission deadline has passed');
      router.push('/slates');
    }
  }, [currentBallot.slateSubmissionDeadline]);

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
      if (!!value.newValue && value.newValue !== value.oldValue) {
        if (paramKey === 'slateStakeAmount') {
          value.newValue = convertedToBaseUnits(value.newValue, 18);
        } else if (paramKey === 'gatekeeperAddress') {
          // Lower-case so that `isAddress()` can handle it
          value.newValue = value.newValue.toLowerCase();
        }
        return {
          ...acc,
          [paramKey]: value,
        };
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

      setPendingText('Creating governance slate (check MetaMask)...');
      // Submit the slate info to the contract
      errorMessage = 'error submitting slate.';
      const slate: any = await sendRecommendGovernanceSlateTx(
        contracts.gatekeeper,
        slateMetadata.resource,
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
              const changes: IParameterChangesObject = filterParameterChanges(values.parameters);
              if (Object.keys(changes).length === 0) {
                setFieldError('parametersForm', 'You must enter some parameters to change');
              } else {
                await handleSubmitSlate(values, changes);
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
                        newSlateStakeAmount={values.parameters.slateStakeAmount.newValue}
                        newGatekeeperAddress={values.parameters.gatekeeperAddress.newValue}
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
