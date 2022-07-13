const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
require("dotenv").config

const imagesLocation = "./images/randomNFT"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "",
            value: 0,
        },
    ],
}

// const tokenURIs = [
//     "ipfs://QmXsqHtxgpdVvDZeCrBwhS2RYjK9pDSa9HLi6bohW82sAZ",
//     "ipfs://QmSDqY9qcRfuDmYb6tjbUa7Z3NNFN3vLyZffLdvXwQ6Cdi",
//     "ipfs://QmQxQLZzvGv9EpVXxGfbowQYGDsL1hXMoKphzY6zyK6ieA",
// ]

const FUND_AMOUNT = "1000000000000000000000"

module.exports = async function () {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const gasLane = network.config.gasLane
    const mintFee = network.config.mintFee
    const callbackGasLimit = network.config.callbackGasLimit

    let vrfCoordinatorV2Address, subscriptionId

    if (process.env.UPLOAD_TO_PINATA) {
        tokenURIs = await handleTokenURIs()
    }
    log("Tokens are handled")

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = network.config.vrfCoordinatorV2
        subscriptionId = network.config.subscriptionId
    }

    log("----------------------------------")

    await storeImages(imagesLocation)

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane,
        callbackGasLimit,
        tokenURIs,
        mintFee,
    ]

    log("Deploying")
    const randomIpfsNft = await deploy("RandomIPFSNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("----------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenURIs() {
    tokenURIs = []
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenURIs.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uploaded")
    console.log(tokenURIs)
    return tokenURIs
}

module.exports.tags = ["all", "randomipfs", "main"]
