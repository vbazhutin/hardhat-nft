const { assert, expect } = require("chai")
const { ethers, network, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT test", () => {
          let randomIpfsNft, deployer, VRFCoordinatorV2Mock

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              buyer = accounts[1]
              await deployments.fixture(["randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIPFSNFT", deployer)
              VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("constructor", () => {
              it("Sets the correct data", async () => {
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()

                  assert.equal(tokenCounter, "0")
                  assert.equal(name, network.config.name)
                  assert.equal(symbol, network.config.symbol)
              })
          })

          describe("Request NFT", () => {
              it("Reverts if not enough ETH", async () => {
                  await expect(randomIpfsNft.requestNFT()).to.be.revertedWith(
                      "RandomIPFSNFT__NeedMoreETHSent"
                  )
              })

              it("Requests NFT to mint, proceeds to get a request ID, emit an event", async () => {
                  const fee = await randomIpfsNft.getMintFee()
                  const tx = await randomIpfsNft.requestNFT({ value: fee })
                  await expect(tx).to.emit(randomIpfsNft, "NftRequested")
                  const txReceipt = await tx.wait(1)
                  assert(txReceipt.events[1].args.requestId)
              })
          })

          describe("Fulfill random words and mint an nft", function () {
              it("Mints an nft when a random number is returned", async () => {
                  console.log("Setting up promise")
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          console.log("Nft was minted successfully")

                          try {
                              const senderNftBalance = await randomIpfsNft.balanceOf(
                                  deployer.address
                              )
                              const ownerOfToken = await randomIpfsNft.ownerOf("0")
                              assert(ownerOfToken, deployer.address)
                              assert(senderNftBalance == 1)
                              expect(await randomIpfsNft.getDogTokenURIs("0")).to.include("ipfs://")
                              expect(await randomIpfsNft.getTokenCounter()).to.equal(1)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      console.log("Requesting NFT")
                      const fee = await randomIpfsNft.getMintFee()
                      const tx = await randomIpfsNft.requestNFT({ value: fee })
                      const txReceipt = await tx.wait(1)
                      const requestId = txReceipt.events[1].args.requestId
                      await VRFCoordinatorV2Mock.fulfillRandomWords(
                          requestId,
                          randomIpfsNft.address
                      )
                  })
              })
          })

          describe("Withdraw", () => {
              it("Reverts when sender is not the contract owner", async () => {
                  const fee = await randomIpfsNft.getMintFee()
                  const tx = await randomIpfsNft.requestNFT({ value: fee })
                  await tx.wait(1)

                  const randomipfs = randomIpfsNft.connect(buyer)

                  await expect(randomipfs.withdraw()).to.be.reverted
              })

              it("Withdraws money from the contract", async () => {
                  const senderInitialBalance = await deployer.getBalance()
                  const fee = await randomIpfsNft.getMintFee()
                  const tx = await randomIpfsNft.requestNFT({ value: fee })
                  const txReceipt = await tx.wait(1)
                  const withdrawTx = await randomIpfsNft.withdraw()
                  const withdrawReceipt = await withdrawTx.wait(1)
                  const contractBalance = await randomIpfsNft.provider.getBalance(
                      randomIpfsNft.address
                  )
                  assert.equal(contractBalance, "0")

                  const { gasUsed: txGas, effectiveGasPrice: txGasPrice } = txReceipt
                  const { gasUsed: wGas, effectiveGasPrice: wGasPrice } = withdrawReceipt
                  const txGasCost = txGas.mul(txGasPrice)
                  const withdrawGasCost = wGas.mul(wGasPrice)

                  const senderBalance = await deployer.getBalance()

                  assert.equal(
                      senderInitialBalance,
                      senderBalance.add(txGasCost).add(withdrawGasCost).toString()
                  )
              })
          })
      })
