import * as React from 'react';
import { withRouter } from 'next/router';
import styled from 'styled-components';
import { COLORS, BUTTON_COLORS } from '../styles';
import Tag from './Tag';
import { splitAddressHumanReadable } from '../utils/format';
import Button from './Button';
import { Separator } from './Form';

const Wrapper = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
  border: ${(props: any) =>
    props.proposals && props.proposals[props.id]
      ? '3px solid #59B6E6'
      : '2px solid ' + COLORS.grey5};
  /* border: 2px solid ${COLORS.grey5}; */
  box-shadow: 0px 5px 5px ${COLORS.grey5};
  margin-bottom: 1rem;
  margin-right: 1rem;
  cursor: pointer;
`;
const CardTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${COLORS.text};
`;
const CardSubTitle = styled.div`
  font-size: 1rem;
  margin-top: 0.5rem;
`;
const CardDescription = styled.div`
  font-size: 0.8rem;
  margin-top: 1rem;
  color: ${COLORS.grey3};
`;

const CardUser = styled(CardDescription)`
  display: flex;
  flex-flow: column wrap;
`;
export const CardAddress = styled(CardDescription)`
  margin-top: 0.5rem;
  letter-spacing: 0.05em;
`;

const ChoiceOptions = styled.div`
  display: flex;
  margin-top: 0.5rem;
`;

type Props = {
  category: string;
  title: string;
  subtitle: string;
  description: string;
  address?: string;
  recommender?: string;
  status?: string;
  choices?: any;
  onSetChoice?: any;
  router?: any;
  id?: string;
  onClick?: any;
  active?: boolean;
};

const ChoiceButton: any = styled(Button)`
  background-color: ${({ firstChoice, secondChoice }: any) =>
    firstChoice
      ? BUTTON_COLORS.firstChoice
      : secondChoice
      ? BUTTON_COLORS.secondChoice
      : COLORS.white};
  color: ${({ firstChoice, secondChoice }: any) =>
    firstChoice
      ? BUTTON_COLORS.firstChoiceFg
      : secondChoice
      ? BUTTON_COLORS.secondChoiceFg
      : COLORS.text};
  border: ${({ firstChoice, secondChoice }: any) =>
    firstChoice || secondChoice ? '2px solid transparent' : '2px solid ' + COLORS.grey5};
`;

const Card: React.FunctionComponent<Props> = props => {
  function handleViewSlateDetails() {
    props.router.push({
      pathname: '/slates/slate',
      // asPath: `/slates/${slate.ownerAddress}`,
      query: {
        id: props.id,
      },
    });
  }
  return (
    <Wrapper id={props.id} onClick={props.onClick}>
      <div className="flex">
        <Tag status={''}>{props.category.toUpperCase()}</Tag>
        {props.status && <Tag status={props.status}>{props.status}</Tag>}
      </div>

      <CardTitle>{props.title}</CardTitle>
      <CardSubTitle>{props.subtitle}</CardSubTitle>
      <CardDescription>{props.description}</CardDescription>

      {props.address && (
        <CardUser>
          <div>{props.recommender}</div>
          <CardAddress>{splitAddressHumanReadable(props.address)}</CardAddress>
        </CardUser>
      )}

      {props.choices && (
        <>
          <div onClick={handleViewSlateDetails}>View slate details</div>
          <Separator />
          <CardDescription>{'Select an option'}</CardDescription>
          <ChoiceOptions>
            <ChoiceButton
              onClick={() => props.onSetChoice('first', props.id)}
              firstChoice={props.choices.first === props.id}
              data-testid="first-choice"
            >
              {'1st Choice'}
            </ChoiceButton>
            <ChoiceButton
              onClick={() => props.onSetChoice('second', props.id)}
              secondChoice={props.choices.second === props.id}
              data-testid="second-choice"
            >
              {'2nd Choice'}
            </ChoiceButton>
          </ChoiceOptions>
        </>
      )}
    </Wrapper>
  );
};

export default withRouter(Card);
