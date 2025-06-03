const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let MyToken, myToken, owner, addr1, addr2;

  beforeEach(async function () {
    // 컨트랙트 배포
    MyToken = await ethers.getContractFactory("MyToken");
    [owner, addr1, addr2] = await ethers.getSigners();
    myToken = await MyToken.deploy();
    await myToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right token name", async function () {
      expect(await myToken.name()).to.equal("MyToken");
    });

    it("Should set the right token symbol", async function () {
      expect(await myToken.symbol()).to.equal("MTK");
    });

    it("Should set 18 decimals", async function () {
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await myToken.totalSupply()).to.equal(0);
    });

    it("Should set the right owner", async function () {
      expect(await myToken.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await myToken.mint(addr1.address, mintAmount);
      
      expect(await myToken.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await myToken.totalSupply()).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      
      await expect(
        myToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await myToken.mint(addr1.address, mintAmount);
    });

    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      
      await myToken.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await myToken.balanceOf(addr1.address)).to.equal(
        ethers.utils.parseEther("900")
      );
      expect(await myToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const transferAmount = ethers.utils.parseEther("2000");
      
      await expect(
        myToken.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });
}); 