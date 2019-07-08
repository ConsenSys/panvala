import * as React from 'react';
import styled, { css } from 'styled-components';
import { COLORS, BUTTON_COLORS } from '../styles';
import Tag from './Tag';
import { splitAddressHumanReadable } from '../utils/format';
import Button from './Button';
import Flex from './system/Flex';
import { Separator } from './Separator';
import { IChoices, IProposal } from '../interfaces';
import RouterLink from './RouterLink';
import Text from './system/Text';
import { SLATE } from '../utils/constants';

const animatedCss = css`
  opacity: 1;
  transform: translateY(0);
`;

const Wrapper = styled.div<{ isActive?: boolean; asPath?: string; animated: boolean }>`
  width: 300px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
  border: ${({ isActive }) => (isActive ? '3px solid #59B6E6' : '2px solid ' + COLORS.grey5)};
  box-shadow: 0px 5px 5px ${COLORS.grey5};
  margin-bottom: 1rem;
  margin-right: 1rem;
  max-height: 100%;
  ${({ asPath }) => asPath && asPath.startsWith('/ballots') && 'height: 100%'};
  ${({ asPath }) => !asPath && 'cursor: pointer'};

  opacity: 0;
  transform: translateY(10px);
  transition: 500ms all ease-in-out;
  ${props => props.animated && animatedCss};
`;
const CardTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${COLORS.text};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const CardSubTitle = styled.div`
  font-size: 1rem;
  margin-top: 0.5rem;
`;
const CardDescription = styled.div`
  font-size: 0.8rem;
  margin-top: 1rem;
  color: ${COLORS.grey3};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardUser = styled.div`
  font-size: 0.8rem;
  margin-top: 0.5rem;
  color: ${COLORS.grey3};
  display: flex;
  flex-flow: column wrap;
`;
export const CardAddress = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.grey3};
  margin-top: 0.5rem;
  letter-spacing: 0.05em;
`;

const ChoiceOptions = styled.div`
  display: flex;
  margin-top: 0.5rem;
`;

const ViewSlateDetails = styled.div`
  display: flex;
  margin: 0.6rem 0;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
`;
const CardProposals = styled.div`
  display: flex;
  margin: 0.6rem 0;
  font-size: 0.8rem;
  font-weight: 500;
`;
const CardProposal = styled.div`
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  color: ${COLORS.grey3};
  display: flex;
  flex-flow: column wrap;
`;

interface ICardProps {
  category: string;
  title?: string;
  subtitle: string;
  description: string;
  address?: string;
  recommender?: string;
  status?: string;
  incumbent?: boolean;
  // /ballots/vote
  choices?: IChoices;
  onSetChoice?: any;
  slateID?: string;
  proposals?: IProposal[];
  asPath?: string;
  // /slates
  onClick?: any;
  verifiedRecommender?: boolean;
  // /slates/create/grant
  isActive?: boolean;
  type: string;
}

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
  margin-right: 1rem;
`;

const Card: React.FunctionComponent<ICardProps> = props => {
  const [animated, setAnimated] = React.useState(false);
  React.useEffect(() => {
    setTimeout(() => {
      setAnimated(true);
    }, 100);
  }, []);

  return (
    <Wrapper
      onClick={props.onClick}
      isActive={props.isActive}
      asPath={props.asPath}
      animated={animated}
    >
      <Flex>
        {/* GRANT | PENDING TOKENS */}
        <Tag status={''}>{props.category.toUpperCase()}</Tag>
        {props.status && <Tag status={props.status}>{props.status}</Tag>}
      </Flex>

      {props.type === SLATE && props.incumbent ? (
        <Text my={2} fontSize={11} color="blue" fontWeight="bold">
          {'INCUMBENT'}
        </Text>
      ) : (
        props.type === SLATE &&
        !props.verifiedRecommender && (
          <Text my={2} fontSize={11} color="reds.dark" fontWeight="bold">
            {'UNVERIFIED RECOMMENDER'}
          </Text>
        )
      )}

      <CardTitle>
        {props.address && props.verifiedRecommender && props.recommender
          ? props.recommender
          : props.address
          ? splitAddressHumanReadable(props.address)
          : props.title && props.title}
      </CardTitle>
      <CardSubTitle>{props.subtitle}</CardSubTitle>
      <CardDescription>{props.description}</CardDescription>

      {props.address && ( // 0x D09C C3BC 67E4 294C 4A44 6D8E 4A29 34A9 2141 0ED7
        <CardUser>
          {props.recommender && <div>{props.recommender}</div>}
          <CardAddress>{splitAddressHumanReadable(props.address)}</CardAddress>
        </CardUser>
      )}

      {props.choices && ( // renders in /ballots/vote
        <>
          <RouterLink
            newTab
            href={`/slates/slate?id=${props.slateID}`}
            as={`/slates/${props.slateID}`}
          >
            <ViewSlateDetails>View slate details</ViewSlateDetails>
          </RouterLink>
          <Separator />

          <CardProposals>Grant Proposals:</CardProposals>
          {props.proposals &&
            props.proposals.length > 0 &&
            props.proposals.map(p => <CardProposal key={p.id}>{p.title}</CardProposal>)}

          <Separator />
          <CardDescription>{'Select an option'}</CardDescription>
          <ChoiceOptions>
            <ChoiceButton
              onClick={() => props.onSetChoice('firstChoice', props.slateID)}
              firstChoice={props.choices.firstChoice === props.slateID}
              data-testid="first-choice"
            >
              {'1st Choice'}
            </ChoiceButton>
            <ChoiceButton
              onClick={() => props.onSetChoice('secondChoice', props.slateID)}
              secondChoice={props.choices.secondChoice === props.slateID}
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

export default Card;
