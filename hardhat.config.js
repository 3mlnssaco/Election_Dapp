require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: "https://rpc.sepolia.eth.gateway.fm",
      accounts: ["0x00847e4bade45868c4a2b7aec41325d239cfb0ce2a19590afe2c890c5ab525cc"],
      chainId: 11155111
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      sepolia: "M559GPRAIM2WBCV4D4SU47NVZPTE8148H9"
    }
  }
}; 