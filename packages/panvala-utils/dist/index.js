"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const { solidityKeccak256, randomBytes, bigNumberify } = ethers_1.utils;
const SlateCategories = {
    GRANT: '0',
    GOVERNANCE: '1',
};
const ContestStatus = {
    Empty: '0',
    NoContest: '1',
    Active: '2',
    RunoffPending: '3',
    Finalized: '4',
};
/**
 * generateCommitHash
 *
 * Concatenate each (category, firstChoice, secondChoice), followed
 * by the salt, each element as a full 32-byte word. Hash the result.
 *
 * keccak256(category + firstChoice + secondChoice ... + salt)
 * @param {*} votes { category: { firstChoice, secondChoice }}
 * @param {ethers.BN} salt Random 256-bit number
 */
function generateCommitHash(votes, salt) {
    const types = [];
    const values = [];
    Object.keys(votes).forEach((category) => {
        const { firstChoice, secondChoice } = votes[category];
        types.push('uint', 'uint', 'uint');
        values.push(category, firstChoice, secondChoice);
    });
    types.push('uint');
    values.push(salt);
    // const packed = ethers.utils.solidityPack(types, values);
    // console.log(packed);
    return solidityKeccak256(types, values);
}
/**
 * Calculate a random number w/ 32 bytes of entropy
 * @return {ethers.BN}
 */
function randomSalt() {
    const salt = bigNumberify(randomBytes(32));
    return salt;
}
/**
 * generateCommitMessage
 *
 * @param {string} commitHash keccak256(category + firstChoice + secondChoice ... + salt)
 * @param {*} ballotChoices { firstChoice, secondChoice }
 * @param {string} salt Random 256-bit number
 */
function generateCommitMessage(commitHash, ballotChoices, salt) {
    return `Commit hash: ${commitHash}. First choice: ${ballotChoices.firstChoice}. Second choice: ${ballotChoices.secondChoice}. Salt: ${salt}`;
}
/**
 * Encode a ballot to be submitted to Gatekeeper.revealManyBallots()
 * @param {*} categories
 * @param {*} firstChoices
 * @param {*} secondChoices
 */
function encodeBallot(categories, firstChoices, secondChoices) {
    const types = ['uint256[]', 'uint256[]', 'uint256[]'];
    const values = [categories, firstChoices, secondChoices];
    const encoded = ethers_1.utils.defaultAbiCoder.encode(types, values);
    return encoded;
}
module.exports = {
    generateCommitHash,
    randomSalt,
    generateCommitMessage,
    encodeBallot,
    SlateCategories,
    ContestStatus,
};
