const fs = require('fs');
const prettier = require('prettier');
const path = require('path');

const currentDir = path.resolve(__dirname);
const readDir = `${currentDir}/../governance-contracts/build/contracts`;
const writeDir = `${currentDir}/../packages/panvala-utils/abis`;
const prettierConfig = `${currentDir}/../packages/panvala-utils/.prettierrc`;

const Gatekeeper = fs.readFileSync(`${readDir}/Gatekeeper.json`);
const ParameterStore = fs.readFileSync(`${readDir}/ParameterStore.json`);
const TokenCapacitor = fs.readFileSync(`${readDir}/TokenCapacitor.json`);
const BasicToken = fs.readFileSync(`${readDir}/BasicToken.json`);
const TimeTravelingGatekeeper = fs.readFileSync(`${readDir}/TimeTravelingGatekeeper.json`);

const contracts = [Gatekeeper, ParameterStore, TokenCapacitor, BasicToken, TimeTravelingGatekeeper];

prettier.resolveConfig(prettierConfig).then(options => {
  contracts.forEach(contract => {
    // extract only the fields we need
    const { abi, bytecode, contractName, networks, devdoc } = JSON.parse(contract);

    // serialize json file
    const jsonFile = JSON.stringify({
      abi,
      bytecode,
      contractName,
      networks,
      devdoc,
    });

    console.log(`Formatting ${contractName}`);
    // format w/ prettier
    const formattedFile = prettier.format(jsonFile, {
      ...options,
      parser: 'json',
    });

    console.log(`Writing ${contractName} to /packages/panvala-utils/abis/`);
    // write to panvala-utils/abis
    fs.writeFile(`${writeDir}/${contractName}.json`, formattedFile, err => {
      if (err) throw err;
      console.log('The file has been written:', contractName);
    });
  });
});
