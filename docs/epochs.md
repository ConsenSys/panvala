# Epoch stages

## Initial epoch/distribution

2/1: end of batch 1, week 13 (beginning of batch 2, week 1)

<!-- prettier-ignore -->
- batch 1 init: 1541260800  (11/03/18 12:00pm)
- batch 1 wk13: 1549040400  (02/01/19 12:00pm) -- first release of tokenCapacitor

- batch 2 init: 1549040400  (02/01/19 12:00pm) -- start of week 01 (startDate)
  - *grant applications accepted until week 9*
- batch 2 wk09: 1554483600  (04/05/19 01:00pm) -- end of week 09   - NOTE: daylight savings time
  - *review grant applications period*
- batch 2 wk11: 1555693200  (04/19/19 01:00pm) -- end of week 11   (votingOpenDate)
  - *commit vote period*
- batch 2 wk12: 1556298000  (04/26/19 01:00pm) -- end of week 12   (votingCloseDate)
  - *reveal vote period*
- batch 2 wk13: 1556902800  (05/03/19 01:00pm) -- second release   (finalityDate)
  - *grant distribution*

- batch 3 init: 1556902800  (05/03/19 01:00pm) -- start of week 01 (startDate)
- batch 3 wk11: 1563555600  (07/19/19 01:00pm) -- end of week 11   (votingOpenDate)
- batch 3 wk12: 1564160400  (07/26/19 01:00pm) -- end of week 12   (votingCloseDate)
- batch 3 wk13: 1564765200  (08/02/19 01:00pm) -- third release

## Constants/calculations

- EPOCH_DURATION: gateKeeper.epochLength = 13 weeks || 604800 x 13
- FIRST_EPOCH_STATE_DATE = gateKeeper.startTime() = (1541260800 || feb 2 - 13 weeks || 1549040400 - EPOCH_DURATION)
  - start time of the first batch/epoch

## Timeline/states

weeks 1-11: create proposal(s), submit slate(s)

- BALLOT_PRE_VOTING (ballotID)
- slate.status: 0 (unstaked)
- slate.status: ? (staked?)
- PENDING_TOKENS

week 12: commit votes on ballot of slate(s)

- BALLOT_OPEN
- PENDING_VOTE

week 13: reveal votes on ballot of slate(s)

- BALLOT_CLOSED
- PENDING_VOTE

post week 13: after slate has been finalized

- BALLOT_PRE_VOTING (ballotID + 1)
- slate.status(new slates): 0 (unstaked)

- BALLOT_FINALIZED (ballotID)
- slate.status(previous slate): 1 or 2 (rejected or accepted)
