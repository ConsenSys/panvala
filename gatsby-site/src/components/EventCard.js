import React from 'react';
import styled from 'styled-components';
import Box from './system/Box';

const Wrapper = styled(Box)`
  box-sizing: 'border-box';
  height: 120px;
  width: 450px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: ${({ nextEvent }) =>
    nextEvent ? '0px 40px 25px rgba(20, 30, 120, 0.56)' : '0px 0px 70px rgba(0, 0, 0, 0.1)'};
  z-index: ${({ nextEvent }) => (nextEvent ? '500' : '10')};
`;

const EventCard = props => {
  const { date, nextEvent, eventName, eventDescription, expired } = props;

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
        width="100px"
        bg={nextEvent ? 'teal' : '#D1D5F4'}
        px="4rem"
        py="2rem"
        flex
        column
        alignItems="center"
        justifyContent="center"
        color={nextEvent ? 'white' : 'black'}
        opacity={expired ? '0.2' : '1'}
      >
        <Box fontSize={3} letterSpacing={6}>
          {month.toUpperCase()}
        </Box>
        <Box fontSize={6} bold>
          {day}
        </Box>
      </Box>

      <Box flex column textAlign="left" px="2rem" opacity={expired ? '0.2' : '1'}>
        <Box bold fontSize={3}>
          {eventName}
        </Box>
        <Box>{eventDescription}</Box>
        <Box>{time}</Box>
      </Box>
    </Wrapper>
  );
};

export default EventCard;
