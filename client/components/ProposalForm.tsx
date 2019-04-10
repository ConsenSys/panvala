import * as React from 'react';
import * as yup from 'yup';
import { Formik, Form } from 'formik';
import { Separator } from '../components/Separator';
import Label from './Label';
import SectionLabel from './SectionLabel';
import Button from './Button';
import { toast } from 'react-toastify';
import FieldText from './FieldText';
import FieldTextarea from './FieldTextarea';
import { convertedToBaseUnits } from '../utils/format';

const FormSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, 'Too Short!')
    .max(70, 'Too Long!')
    .required('Required'),
  lastName: yup
    .string()
    .min(2, 'Too Short!')
    .max(70, 'Too Long!'),
  email: yup
    .string()
    .email('Invalid email')
    .required('Required'),
  title: yup
    .string()
    .max(70, 'Too Long!')
    .required('Required'),
  summary: yup
    .string()
    .max(4000, 'Too Long!')
    .required('Required'),
  tokensRequested: yup
    .string()
    .matches(/^[0-9]+\.?[0-9]{0,18}$/, 'Must be a number with no more than 18 decimals')
    .required('Required'),
  totalBudget: yup.string().required('Required'),
  otherFunding: yup.string().required('Required'),
  awardAddress: yup.string().required('Required'),
});

interface IProps {
  onHandleSubmit: any;
}

const ProposalForm: React.SFC<IProps> = ({ onHandleSubmit }) => {
  return (
    <div>
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          email: '',
          github: '',
          tokensRequested: '',
          title: '',
          summary: '',
          website: '',
          projectPlan: '',
          projectTimeline: '',
          teamBackgrounds: '',
          file: {},
          totalBudget: '',
          otherFunding: '',
          awardAddress: '',
        }}
        validationSchema={FormSchema}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            // throws on underflow (x.1234567890123456789)
            const tokensRequested = convertedToBaseUnits(values.tokensRequested, 18);

            const baseUnitsValues = {
              ...values,
              tokensRequested,
              // max: totalUpcomingDispatch
            };
            await onHandleSubmit(baseUnitsValues);
          } catch (error) {
            setFieldError('tokensRequested', 'Number cannot have more than 18 decimals');
          }

          setSubmitting(false);
        }}
      >
        {({ isSubmitting, setFieldValue }) => (
          <Form>
            <div className="pa4">
              <SectionLabel>{'PERSONAL INFORMATION'}</SectionLabel>

              <FieldText
                required
                label={'First Name / Organization'}
                name="firstName"
                placeholder="Enter your first name or the name of your organization"
              />
              <FieldText label={'Last Name'} name="lastName" placeholder="Enter your last name" />
              <FieldText required label={'Email'} name="email" placeholder="Enter your email" />
              <FieldText label={'Github'} name="github" placeholder="Enter your github username" />
            </div>

            <Separator />

            <div className="pa4">
              <SectionLabel>{'PROJECT DETAILS'}</SectionLabel>

              <FieldText
                required
                label={'Project Name'}
                name="title"
                placeholder="Enter project name"
              />
              <FieldText label={'Website'} name="website" placeholder="Enter project website" />

              <FieldTextarea
                required
                label={'Project Summary'}
                name="summary"
                placeholder="Enter project proposal"
              />
              <FieldTextarea
                label={'Project Plan'}
                name="projectPlan"
                placeholder="Enter project plan"
              />
              <FieldTextarea
                label={'Timeline and Milestones'}
                name="projectTimeline"
                placeholder="Enter project timeline and milestones"
              />
              <FieldTextarea
                label={"What are your and your team's backgrounds?"}
                name="teamBackgrounds"
                placeholder="Enter your and your team's backgrounds"
              />

              <Label htmlFor="file">{'File upload'}</Label>
              <div className="mt2">
                <input
                  type="file"
                  name="file"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    if (!event.currentTarget.files) {
                      return;
                    }
                    const file = event.currentTarget.files[0];
                    if (file.type !== 'application/pdf') {
                      toast.error('Invalid file type. Please upload .pdf');
                      setFieldValue('file', {});
                    } else {
                      setFieldValue('file', file);
                    }
                  }}
                  placeholder="Choose file"
                />
              </div>
            </div>

            <Separator />

            <div className="pa4">
              <SectionLabel>{'FINANCIAL DETAILS'}</SectionLabel>

              <FieldTextarea
                required
                label={'What is the total budget of your project (in USD)?'}
                name="totalBudget"
                placeholder="Enter the total budget of your project"
              />

              <FieldText
                required
                label={'How many tokens are you requesting?'}
                name="tokensRequested"
                placeholder="Enter the amount of tokens you would like"
              />

              <FieldText
                required
                label={'Award address'}
                name="awardAddress"
                placeholder="Enter the address of the token recipient for this proposal"
              />

              <FieldTextarea
                required
                label={'Have you applied/received other funding?'}
                name="otherFunding"
                placeholder="Enter any other funding you have received"
              />
            </div>

            <Separator />

            <div className="flex flex-column pv2 ph4 items-end">
              <div className="flex">
                <Button type="default" large disabled={true}>
                  {'Back'}
                </Button>
                <Button type="submit" large primary disabled={isSubmitting}>
                  {'Confirm and Submit'}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ProposalForm;
