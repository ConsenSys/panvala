import * as React from 'react';
import styled from 'styled-components';
import { Formik, Form, FormikContext } from 'formik';
import { TransactionResponse, TransactionReceipt } from 'ethers/providers';
import { withRouter, SingletonRouter } from 'next/router';
import { toast } from 'react-toastify';
import * as yup from 'yup';

import { COLORS } from '../../styles';
import CenteredTitle from '../../components/CenteredTitle';
import Checkbox from '../../components/Checkbox';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { EthereumContext } from '../../components/EthereumProvider';
import FieldText, { ErrorMessage } from '../../components/FieldText';
import FieldTextarea from '../../components/FieldTextarea';
import CenteredWrapper from '../../components/CenteredWrapper';
import Label from '../../components/Label';
import SectionLabel from '../../components/SectionLabel';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import {
  IAppContext,
  IProposal,
  IProposalMetadata,
  ISlateMetadata,
  ISaveSlate,
  IEthereumContext,
} from '../../interfaces';
import { ipfsAddObject } from '../../utils/ipfs';
import { LogDescription } from 'ethers/utils';
import { convertedToBaseUnits } from '../../utils/format';
import { postSlate } from '../../utils/api';
import Image from '../../components/Image';

const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

const FormSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Required'),
  title: yup
    .string()
    .max(80, 'Too Long!')
    .required('Required'),
  firstName: yup.string().required('Required'),
  description: yup
    .string()
    .max(5000, 'Too Long!')
    .required('Required'),
  recommendation: yup.string().required('Required'),
});

interface IProposalsObject {
  [key: string]: boolean;
}

interface IFormValues {
  email: string;
  title: string;
  firstName: string;
  lastName?: string;
  organization?: string;
  description: string;
  recommendation: string;
  proposals: IProposalsObject;
  selectedProposals: IProposal[];
}

interface IProposalInfo {
  metadata: IProposalMetadata[];
  multihashes: Buffer[];
}

const CreateSlate: React.FunctionComponent<{ router: SingletonRouter }> = ({ router }) => {
  const query = router.query;

  // modal opener
  const [isOpen, setOpenModal] = React.useState(false);
  // get proposals and eth context
  const { proposals, onRefreshSlates }: IAppContext = React.useContext(AppContext);
  const { account, ethProvider, contracts, onConnectEthereum }: IEthereumContext = React.useContext(
    EthereumContext
  );

  React.useEffect(() => {
    onConnectEthereum();
  }, []);

  /**
   * getRequestIDs
   * Submit proposals to the token capacitor and get corresponding request IDs
   * @param proposalInfo
   */
  function getRequestIDs(proposalInfo: IProposalInfo) {
    const { metadata, multihashes: proposalMultihashes } = proposalInfo;
    // submit to the capacitor, get requestIDs
    // token distribution details
    const beneficiaries: string[] = metadata.map(p => p.awardAddress);
    const tokenAmounts: string[] = metadata.map(p => convertedToBaseUnits(p.tokensRequested, 18));
    console.log('tokenAmounts:', tokenAmounts);

    return contracts.tokenCapacitor.functions
      .createManyProposals(beneficiaries, tokenAmounts, proposalMultihashes)
      .then((response: TransactionResponse) => {
        return ethProvider.waitForTransaction(response.hash);
      })
      .then((receipt: TransactionReceipt) => {
        if (receipt.logs && contracts && contracts.tokenCapacitor) {
          // console.log('Transaction Mined: ' + receipt);
          // console.log('logs:', receipt.logs);

          // Get the ProposalCreated logs from the receipt
          const decoded: LogDescription[] = receipt.logs
            .map(log => {
              return contracts.tokenCapacitor.interface.parseLog(log);
            })
            .filter(d => d !== null)
            .filter(d => d.name == 'ProposalCreated');

          // Extract the requestIDs
          const requestIDs = decoded.map(d => d.values.requestID);

          return requestIDs;
        }
      });
  }

  /**
   * Submit requestIDs and metadataHash to the Gatekeeper.
   * @param requestIDs
   * @param metadataHash
   */
  function submitGrantSlate(requestIDs: any[], metadataHash: string): Promise<any> {
    // these are placeholders for now
    const epochNumber = 1;
    const category = 0; // Grant

    return contracts.gateKeeper.functions
      .recommendSlate(epochNumber, category, requestIDs, Buffer.from(metadataHash))
      .then((response: TransactionResponse) => {
        return ethProvider.waitForTransaction(response.hash);
      })
      .then((receipt: TransactionReceipt) => {
        if (receipt.logs) {
          // console.log('Transaction Mined: ' + receipt);
          // console.log('logs:', receipt.logs);

          // Get the SlateCreated logs from the receipt
          const decoded: LogDescription[] = receipt.logs
            .map(log => {
              return contracts.gateKeeper.interface.parseLog(log);
            })
            .filter(d => d !== null)
            .filter(d => d.name == 'SlateCreated');

          // Extract the slateID
          const slateID: string = decoded[0].values.slateID.toString();
          const slate: any = { slateID, metadataHash };
          console.log('Created slate', slate);
          return slate;
        }
      });
  }

  /**
   * Submit slate information to the Gatekeeper, saving metadata in IPFS
   *
   * add proposals to ipfs, get multihashes
   * send tx to token_capacitor: createManyProposals (with multihashes)
   * get requestIDs from events
   * add slate to IPFS with metadata
   * send tx to gate_keeper: recommendSlate (with requestIDs & slate multihash)
   * get slateID from event
   * add slate to db: slateID, multihash
   * @param values Form values
   * @param selectedProposals
   */
  async function handleSubmitSlate(values: IFormValues, selectedProposals: IProposal[]) {
    if (!account) {
      const msg =
        'To create a slate, you must first log into MetaMask and switch to the Rinkeby Test Network.';
      toast.error(msg);
      return;
    }

    // save proposal metadata to IPFS to be included in the slate metadata
    console.log('preparing proposals...');

    const proposalMultihashes: Buffer[] = await Promise.all(
      selectedProposals.map(async (metadata: IProposalMetadata) => {
        try {
          const multihash: string = await ipfsAddObject(metadata);
          // we need a buffer of the multihash for the transaction
          return Buffer.from(multihash);
        } catch (error) {
          return error;
        }
      })
    );
    // TODO: add proposal multihashes to db

    // Only use the metadata from here forward - do not expose private information
    const proposalMetadatas: IProposalMetadata[] = selectedProposals.map(proposal => {
      return {
        firstName: proposal.firstName,
        lastName: proposal.lastName,
        title: proposal.title,
        summary: proposal.summary,
        tokensRequested: proposal.tokensRequested,
        github: proposal.github,
        id: proposal.id,
        website: proposal.website,
        organization: proposal.organization,
        recommendation: proposal.recommendation,
        projectPlan: proposal.projectPlan,
        projectTimeline: proposal.projectTimeline,
        teamBackgrounds: proposal.teamBackgrounds,
        otherFunding: proposal.otherFunding,
        awardAddress: proposal.awardAddress,
      };
    });

    let errorMessage = '';
    const emptySlate = proposalMetadatas.length === 0;

    // 1. batch create proposals and get request IDs
    const proposalInfo: IProposalInfo = {
      metadata: proposalMetadatas,
      multihashes: proposalMultihashes,
    };

    const getRequests = emptySlate ? Promise.resolve([]) : getRequestIDs(proposalInfo);

    try {
      // console.log('creating proposals...');
      const requestIDs = await getRequests;

      const slateMetadata: ISlateMetadata = {
        firstName: values.firstName,
        lastName: values.lastName,
        organization: values.organization,
        title: values.title,
        description: values.description,
        proposalMultihashes: proposalMetadatas.map(md => md.toString()),
        proposals: proposalMetadatas,
      };
      // console.log(slateMetadata);

      try {
        console.log('saving slate metadata...');
        const slateMetadataHash: string = await ipfsAddObject(slateMetadata);

        // Submit the slate info to the contract
        try {
          const slate: any = await submitGrantSlate(requestIDs, slateMetadataHash);
          console.log('Submitted slate', slate);

          // Add slate to db
          const slateToSave: ISaveSlate = {
            slateID: slate.slateID,
            metadataHash: slateMetadataHash,
            email: values.email,
          };

          const response = await postSlate(slateToSave);
          if (response.status === 200) {
            console.log('Saved slate info');
            toast.success('Saved slate');
            setOpenModal(true);
            await onRefreshSlates();
          } else {
            errorMessage = `problem saving slate info ${response.data}`;
            toast.error(errorMessage);
          }
          // end add slate
        } catch (error) {
          errorMessage = `error submitting slate ${error.message}`;
          toast.error(errorMessage);
        }
      } catch (error) {
        errorMessage = `error saving slate metadata: ${error.message}`;
        // console.error(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      errorMessage = `error preparing proposals : ${error.message}`;
      console.error(errorMessage);
      toast.error(errorMessage);
    }

    // TODO: Should take us to all slates view after successful submission
  }

  return (
    <div>
      <Modal handleClick={() => setOpenModal(false)} isOpen={isOpen}>
        <Image src="/static/check.svg" alt="slate submitted" />
        <ModalTitle>{'Slate submitted.'}</ModalTitle>
        <ModalDescription className="flex flex-wrap">
          Now that your slate has been created you and others have the ability to stake tokens on it
          to propose it to token holders. Once there are tokens staked on the slate it will be
          eligible for a vote.
        </ModalDescription>
        <Button
          type="default"
          onClick={() => {
            setOpenModal(false);
            router.push('/slates');
          }}
        >
          {'Done'}
        </Button>
      </Modal>

      <CenteredTitle title="Create a Grant Slate" />
      <CenteredWrapper>
        <Formik
          initialValues={{
            email: '',
            firstName: '',
            lastName: '',
            organization: '',
            title: '',
            description: '',
            recommendation: query.selectedProposal ? 'grant' : '',
            proposals: query.selectedProposal ? { [query.selectedProposal]: true } : {},
            selectedProposals: [],
          }}
          validationSchema={FormSchema}
          onSubmit={async (values: IFormValues, { setSubmitting, setFieldError }: any) => {
            // console.log('form values:', values);

            const emptySlate = values.recommendation === 'noAction';

            if (emptySlate) {
              // submit the form values with no proposals
              await handleSubmitSlate(values, []);
            } else {
              const selectedProposalIDs: string[] = Object.keys(values.proposals).filter(
                (p: string) => values.proposals[p] === true
              );

              // validate for at least 1 selected proposal
              if (selectedProposalIDs.length === 0) {
                setFieldError('proposals', 'select at least 1 proposal.');
              } else if (proposals && proposals.length) {
                // filter for only the selected proposal objects
                const selectedProposals: IProposal[] = proposals.filter((p: IProposal) =>
                  selectedProposalIDs.includes(p.id.toString())
                );

                // submit the associated proposals along with the slate form values
                await handleSubmitSlate(values, selectedProposals);
              }
            }

            // re-enable submit button
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, setFieldValue, values }: FormikContext<IFormValues>) => (
            <Form>
              <div className="pa4">
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
                  name="description"
                  placeholder="Enter a description for your slate"
                />
              </div>
              <Separator />
              <div className="pa4">
                <SectionLabel>{'RECOMMENDATION'}</SectionLabel>
                <Label htmlFor="recommendation" required>
                  {'What type of recommendation would you like to make?'}
                </Label>
                <ErrorMessage name="recommendation" component="span" />
                <div>
                  <Checkbox name="recommendation" value="grant" label="Recommend grant proposals" />
                  <Checkbox name="recommendation" value="noAction" label="Recommend no action" />
                </div>
                <div>
                  {
                    'By recommending no action you are opposing any current or future slates for this batch.'
                  }
                </div>
              </div>
              <Separator />
              {values.recommendation === 'grant' && (
                <div className="pa4">
                  <SectionLabel>{'GRANTS'}</SectionLabel>
                  <div className="mv3 f7 black-50">
                    {'Select the grants that you would like to add to your slate'}
                  </div>
                  <div className="flex flex-wrap">
                    {proposals &&
                      proposals.map((proposal: IProposal) => (
                        <Card
                          key={proposal.id}
                          category={proposal.category + ' PROPOSAL'}
                          title={proposal.title}
                          subtitle={proposal.tokensRequested.toString()}
                          description={proposal.summary}
                          onClick={() => {
                            if (values.proposals.hasOwnProperty(proposal.id)) {
                              setFieldValue(
                                `proposals.${proposal.id}`,
                                !values.proposals[proposal.id]
                              );
                            } else {
                              setFieldValue(`proposals.${proposal.id}`, true);
                            }
                          }}
                          isActive={values.proposals[proposal.id]}
                        />
                      ))}
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex pa4 justify-end">
                <Button large>{'Back'}</Button>
                <Button type="submit" large primary disabled={isSubmitting}>
                  {'Create Slate'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CenteredWrapper>
    </div>
  );
};

export default withRouter(CreateSlate);
