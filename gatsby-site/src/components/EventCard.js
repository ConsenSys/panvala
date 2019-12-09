import React from 'react';
import styled from 'styled-components';
import Box from './system/Box';

const Wrapper = styled(Box)`
  box-sizing: 'border-box';
  height: 140px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  opacity: ${({ expired }) => (expired ? '0.8' : '1')};
  box-shadow: ${({ nextEvent }) =>
    nextEvent ? '0px 40px 25px rgba(20, 30, 120, 0.56)' : '0px 0px 70px rgba(0, 0, 0, 0.1)'};
  z-index: ${({ nextEvent }) => (nextEvent ? '500' : '10')};
`;

const EventCard = props => {
  const { date, nextEvent } = props;

  const eventDate = new Date(date * 1000);
  const options = {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const dateStr = eventDate.toLocaleDateString(undefined, options);
  const month = dateStr.slice(0, 3);
  const day = dateStr.slice(4, 6);
  const time = dateStr.slice(8);

  return (
    <Wrapper {...props}>
      <Box
        height="100%"
        width="140px"
        bg={nextEvent ? 'teal' : '#D1D5F4'}
        p="1rem"
        flex
        column
        alignItems="center"
        justifyContent="center"
        color={nextEvent ? 'white' : 'black'}
      >
        <Box fontSize={4} letterSpacing={6}>
          {month.toUpperCase()}
        </Box>
        <Box fontSize={7} bold>
          {day}
        </Box>
      </Box>
      <Box flex column textAlign="left" p="2rem" pr="8rem">
        <Box bold fontSize={4}>
          Name of Event
        </Box>
        <Box>Some information</Box>
        <Box>{time}</Box>
      </Box>
    </Wrapper>
  );
};

export default EventCard;
