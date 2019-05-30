# Epoch stages

## Initial epoch/distribution

2/1: end of batch 1, week 13 (beginning of batch 2, week 1)

<!-- prettier-ignore -->
- batch 1 init: 1541260800  (11/03/18 12:00:00pm)
- batch 1 wk13: 1549040400  (02/01/19 12:00:00pm) -- first release of tokenCapacitor

- batch 2 init: 1549040401  (02/01/19 12:00:01pm) -- start of week 01 (startDate)
  - *grant applications accepted until week 9*
- batch 2 wk09: 1554483601  (04/05/19 01:00:01pm) -- end of week 09   - NOTE: daylight savings time
  - *review grant applications period*
- batch 2 wk11: 1555693201  (04/19/19 01:00:01pm) -- end of week 11   (votingOpenDate)
  - *commit vote period*
- batch 2 wk12: 1556298001  (04/26/19 01:00:01pm) -- end of week 12   (votingCloseDate)
  - *reveal vote period*
- batch 2 wk13: 1556902801  (05/03/19 01:00:01pm) -- second release   (finalityDate)
  - *grant distribution*

- batch 3 init: 1556902802  (05/03/19 01:00:02pm) -- start of week 01 (startDate)
- batch 3 wk11: 1563555602  (07/19/19 01:00:02pm) -- end of week 11   (votingOpenDate)
- batch 3 wk12: 1564160402  (07/26/19 01:00:02pm) -- end of week 12   (votingCloseDate)
- batch 3 wk13: 1564765202  (08/02/19 01:00:02pm) -- third release

## Constants/calculations

- EPOCH_DURATION: gateKeeper.epochLength = 13 weeks || 604800 x 13
- FIRST_EPOCH_STATE_DATE = gateKeeper.startTime() = (1541260800 || feb 2 - 13 weeks || 1549040400 - EPOCH_DURATION)
  - start time of the first batch/epoch
- CURRENT_EPOCH_NUMBER: gateKeeper.currentBatchNumber = `(now - FIRST_EPOCH_STATE_DATE) / EPOCH_DURATION`
- CURRENT_EPOCH_START_DATE: gateKeeper.currentBatchStart = `FIRST_EPOCH_START_DATE + (EPOCH_DURATION x CURRENT_EPOCH_NUMBER)`
- EPOCH_START_DATE: gateKeeper.getEpochStart = `FIRST_EPOCH_START_DATE + (EPOCH_NUMBER x EPOCH_DURATION)`
- PROPOSAL_DEADLINE | STAKE_DEADLINE | EPOCH_VOTING_OPEN_DATE: ballot.votingOpenDate = `EPOCH_START_DATE + 11 weeks || EPOCH_START_DATE + (604800 x 11)`

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
