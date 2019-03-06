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
import { IEthereumContext, IAppContext, IProposal } from '../../interfaces';
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
  description: string;
  recommendation: string;
  proposals: IProposalsObject;
  selectedProposals: IProposal[];
}

const CreateSlate: React.FunctionComponent = () => {
  // get proposals and eth context
  const { proposals }: IAppContext = React.useContext(AppContext);
  const {
    account,
    ethProvider,
    contracts: { tokenCapacitor },
  }: IEthereumContext = React.useContext(EthereumContext);

  // add proposals to ipfs, get multihashes
  // TODO: ammend multihashes to db
  // send tx to token_capacitor: createManyProposals (with multihashes)
  // get requestIDs from events
  // add slate to IPFS with metadata
  // send tx to gate_keeper: recommendSlate (with requestIDs & slate multihash)
  // get slateID from event
  // add slate to db: slateID, multihash
  async function handleSubmitSlate(values: IFormValues, selectedProposals: IProposal[]) {
    // save proposals to IPFS to be included in the slate metadata
    const proposalMultihashes: Buffer[] = await Promise.all(
      selectedProposals.map(async (proposal: IProposal) => {
        try {
          const multihash = await ipfsAddObject(proposal);
          // we need a buffer of the multihash for the transaction
          return Buffer.from(multihash);
        } catch (error) {
          return error;
        }
      })
    );

    // token distribution details
    const beneficiaries: string[] = selectedProposals.map(p => p.awardAddress);
    const tokenAmounts: number[] = selectedProposals.map(p => p.tokensRequested);

    try {
      // batch create proposals
      const txResponse: TransactionResponse = await tokenCapacitor.functions.createManyProposals(
        beneficiaries,
        tokenAmounts,
        proposalMultihashes
      );

      // successful tx
      if (txResponse.hash) {
        try {
          // get tx receipt (w/ logs)
          const receipt: TransactionReceipt = await ethProvider.getTransactionReceipt(
            txResponse.hash
          );

          console.log('logs:', receipt.logs);
          // NOTE:
          // logs w/ odd indices are ProposalCreated events
          // topics: [event_signature, proposer, requestID, to]

          // TODO: slates api
          // values.selectedProposals = selectedProposals;
          // const response = await postSlate(values);
          // if (response.status === 200) {
          //   setOpenModal(true);
          // }
        } catch (error) {
          toast.error('error while calling getTransactionReceipt:', error.message);
        }
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
            title: '',
            description: '',
            recommendation: '',
            proposals: {},
            selectedProposals: [],
          }}
          // validationSchema={FormSchema}
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
