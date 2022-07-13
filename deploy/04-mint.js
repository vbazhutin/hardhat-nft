const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({}) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    // BasicNFT
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const basicMintTx = await basicNft.mint()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI("0")}`)

    // RandomIPFSNFT
    const randomIpfsNft = await ethers.getContract("RandomIPFSNFT", deployer)
    const mintFee = await randomIpfsNft.getMintFee()

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000) // 5 min
        randomIpfsNft.once("NftMinted", async () => {
            resolve()
        })

        const randomIpfsNftMintTx = await randomIpfsNft.requestNFT({ value: mintFee })
        const randomINMintTx = await randomIpfsNftMintTx.wait(1)

        if (developmentChains.includes(network.name)) {
            const requestId = randomINMintTx.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })
    console.log(`\nRandom IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI("0")}`)

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSVGNFT", deployer)
    const dynamicNftMintTx = await dynamicSvgNft.mintNft(highValue)
    await dynamicNftMintTx.wait(1)

    console.log(`\nDynamic SVG NFT index tokenURI: ${await dynamicSvgNft.tokenURI("0")}`)
}

module.exports.tags = ["all", "mint"]
