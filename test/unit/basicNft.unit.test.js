const { assert } = require("chai")
const { ethers, getNamedAccounts, network, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT test", () => {
          let basicNft, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNFT")
          })

          it("Allows to mint NFT and updates the state correctly", async () => {
              const mintTx = await basicNft.mint()
              await mintTx.wait(1)

              const counter = await basicNft.getTokenCounter()
              const ownerOfMintedNft = await basicNft.ownerOf("0")
              const tokenURI = await basicNft.tokenURI("0")
              const defaultTokenURI =
                  "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"

              assert.equal(counter, 1)
              assert.equal(ownerOfMintedNft, deployer.address)
              assert.equal(tokenURI, defaultTokenURI)
          })
      })
