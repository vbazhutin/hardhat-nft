const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { etherscan } = require("../hardhat.config")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({}) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = network.config.ethUsdPriceFeed
    }

    log("--------------------------")
    const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf8" })
    const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf8" })
    args = [ethUsdPriceFeedAddress, lowSVG, highSVG]
    log("Deploying DynamicNFTSVG")
    const dynamicSVGNFT = await deploy("DynamicSVGNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying")
        await verify(dynamicSVGNFT.address, args)
    }

    log("--------------------------")
}

module.exports.tags = ["all", "dynamicnft", "main"]
