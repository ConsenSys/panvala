import * as React from 'react';
import styled from 'styled-components';
import { Formik, Form, FormikContext } from 'formik';
import { TransactionResponse, TransactionReceipt } from 'ethers/providers';
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
import { FormWrapper } from '../../components/Form';
import Label from '../../components/Label';
import SectionLabel from '../../components/SectionLabel';
import {
  IEthereumContext,
  IAppContext,
  IProposal,
  IProposalMetadata,
  ISlateMetadata,
} from '../../interfaces';
import { ipfsAddObject } from '../../utils/ipfs';

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
  multihashes: string[];
}

const CreateSlate: React.FunctionComponent = () => {
  // get proposals and eth context
  const { proposals }: IAppContext = React.useContext(AppContext);
  const {
    account,
    ethProvider,
    contracts: { tokenCapacitor, gateKeeper },
  }: IEthereumContext = React.useContext(EthereumContext);

  /**
   * Generate the proposal and slate information necessary for recommending a slate
   * @param txHash
   * @param values
   * @param proposalInfo
   */
  async function generateSlateSubmissionInfo(
    txHash: string,
    values: IFormValues,
    proposalInfo: any
  ) {
    const { multihashes: proposalMultihashes, metadata: proposalMetadata } = proposalInfo;

    const receipt: TransactionReceipt = await ethProvider.waitForTransaction(txHash);
    if (receipt.logs) {
      // console.log('Transaction Mined: ' + receipt);
      // console.log('logs:', receipt.logs);

      // Get the ProposalCreated logs from the receipt
      const decoded = receipt.logs
        .map(log => {
          return tokenCapacitor.interface.parseLog(log);
        })
        .filter(d => d !== null)
        .filter(d => d.name == 'ProposalCreated');

      // Extract the requestIDs
      const requestIDs = decoded.map(d => d.values.requestID);
      // console.log('requestIDs', requestIDs);

      // prepare the slate metadata
      const slateMetadata: ISlateMetadata = {
        firstName: values.firstName,
        lastName: values.lastName,
        organization: values.organization,
        title: values.title,
        description: values.description,
        proposalMultihashes,
        proposals: proposalMetadata,
      };
      // console.log(slateMetadata);

      return { slateMetadata, requestIDs };
    }
  }

  /**
   * Submit requestIDs and metadataHash to the Gatekeeper.
   * @param requestIDs
   * @param metadataHash
   */
  async function submitGrantSlate(requestIDs: any[], metadataHash: string) {
    // these are placeholders for now
    const epochNumber = 1;
    const category = 0; // Grant

    const txResponse: TransactionResponse = await gateKeeper.functions.recommendSlate(
      epochNumber,
      category,
      requestIDs,
      Buffer.from(metadataHash)
    );

    if (txResponse.hash) {
      const receipt = await ethProvider.waitForTransaction(txResponse.hash);
      if (receipt.logs) {
        // console.log('Transaction Mined: ' + receipt);
        // console.log('logs:', receipt.logs);

        // Get the SlateCreated logs from the receipt
        const decoded = receipt.logs
          .map(log => {
            return gateKeeper.interface.parseLog(log);
          })
          .filter(d => d !== null)
          .filter(d => d.name == 'SlateCreated');

        // Extract the slateID
        const slateID = decoded[0].values.slateID;
        const slate = { slateID, metadataHash };
        // console.log('Created slate', slate);
        return slate;
      }
    }
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
    // save proposal metadata to IPFS to be included in the slate metadata
    console.log('preparing proposals...');
    const extractMetadata = (proposal: IProposal) => ({
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
    });

    const proposalMultihashes: Buffer[] = await Promise.all(
      selectedProposals.map(async (metadata: IProposalMetadata) => {
        try {
          const multihash = await ipfsAddObject(metadata);
          // we need a buffer of the multihash for the transaction
          return Buffer.from(multihash);
        } catch (error) {
          return error;
        }
      })
    );
    // TODO: add proposal multihashes to db

    // Only use the metadata from here forward - do not expose private information
    const proposalMetadata = selectedProposals.map(extractMetadata);

    // token distribution details
    const beneficiaries: string[] = proposalMetadata.map(p => p.awardAddress);
    const tokenAmounts: number[] = proposalMetadata.map(p => p.tokensRequested);

    try {
      // batch create proposals
      // console.log('creating proposals...');
      const txResponse: TransactionResponse = await tokenCapacitor.functions.createManyProposals(
        beneficiaries,
        tokenAmounts,
        proposalMultihashes
      );

      // successful tx
      if (txResponse.hash) {
        try {
          const proposalInfo: IProposalInfo = {
            metadata: proposalMetadata,
            multihashes: proposalMultihashes.map(toString),
          };
          const { slateMetadata, requestIDs } = await generateSlateSubmissionInfo(
            txResponse.hash,
            values,
            proposalInfo
          );

          // console.log(slateMetadata);

          try {
            console.log('saving slate metadata...');
            const slateMetadataHash: string = await ipfsAddObject(slateMetadata);

            // Submit the slate info to the contract
            try {
              const slate = await submitGrantSlate(requestIDs, slateMetadataHash);
              console.log('Submitted slate', slate);
            } catch (error) {
              toast.error('error submitting slate', error.message);
            }

            // TODO: add slate to db: slateID, multihash
            // TODO: slates api??
            // values.selectedProposals = selectedProposals;
            // const response = await postSlate(values);
            // if (response.status === 200) {
            //   setOpenModal(true);
            // }
          } catch (error) {
            toast.error('error saving slate metadata:', error.message);
          }
        } catch (error) {
          toast.error('error getting transaction receipt:', error.message);
        }

        // TODO: Should take us to all slates view after successful submission
      }
    } catch (error) {
      toast.error('error while sending tx createManyProposals:', error.message);
    }
  }

  return (
    <div>
      <CenteredTitle title="Create a Grant Slate" />
      <FormWrapper>
        <Formik
          initialValues={{
            email: '',
            firstName: '',
            lastName: '',
            organization: '',
            title: '',
            description: '',
            recommendation: '',
            proposals: {},
            selectedProposals: [],
          }}
          validationSchema={FormSchema}
          onSubmit={async (values: IFormValues, { setSubmitting, setFieldError }: any) => {
            // console.log('form values:', values);
            const selectedProposalIDs: string[] = Object.keys(values.proposals).filter(
              p => values.proposals[p] === true
            );

            // validate for at least 1 selected proposal
            if (selectedProposalIDs.length === 0) {
              setFieldError('proposals', 'select at least 1 proposal.');
            } else {
              // filter for only the selected proposal objects
              const selectedProposals: IProposal[] = proposals.filter((p: IProposal) =>
                selectedProposalIDs.includes(p.id.toString())
              );

              // submit the associated proposals along with the slate form values
              await handleSubmitSlate(values, selectedProposals);
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
                <FieldText required label={'Title'} name="title" placeholder="Enter title" />

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
              <div className="pa4">
                <SectionLabel>{'GRANTS'}</SectionLabel>
                <div className="mv3 f7 black-50">
                  {'Select the grants that you would like to add to your slate'}
                </div>
                <div className="flex flex-wrap">
                  {proposals &&
                    proposals.map((proposal: any) => (
                      <Card
                        key={proposal.id}
                        category={proposal.category + ' PROPOSAL'}
                        title={proposal.title}
                        subtitle={proposal.tokensRequested}
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
                        id={proposal.id}
                        active={values.proposals[proposal.id]}
                      />
                    ))}
                </div>
              </div>
              <Separator />
              <div className="flex pa4 justify-end">
                <Button large>{'Back'}</Button>
                <Button type="submit" large primary disabled={isSubmitting}>
                  {'Create Slate'}
                </Button>
              </div>
              <div>{account}</div>
            </Form>
          )}
        </Formik>
      </FormWrapper>
    </div>
  );
};

export default CreateSlate;
