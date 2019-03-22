"use strict";
exports.__esModule = true;
var ethers_1 = require("ethers");
var solidityKeccak256 = ethers_1.utils.solidityKeccak256, randomBytes = ethers_1.utils.randomBytes, bigNumberify = ethers_1.utils.bigNumberify;
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
    var types = [];
    var values = [];
    Object.keys(votes).forEach(function (category) {
        var _a = votes[category], firstChoice = _a.firstChoice, secondChoice = _a.secondChoice;
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
    var salt = bigNumberify(randomBytes(32));
    return salt;
}
module.exports = {
    generateCommitHash: generateCommitHash,
    randomSalt: randomSalt
};
