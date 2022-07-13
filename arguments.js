const gasLane = network.config.gasLane
const mintFee = network.config.mintFee
const callbackGasLimit = network.config.callbackGasLimit
const vrfCoordinatorV2Address = network.config.vrfCoordinatorV2
const subscriptionId = network.config.subscriptionId

const tokenURIs = [
    "ipfs://QmXsqHtxgpdVvDZeCrBwhS2RYjK9pDSa9HLi6bohW82sAZ",
    "ipfs://QmSDqY9qcRfuDmYb6tjbUa7Z3NNFN3vLyZffLdvXwQ6Cdi",
    "ipfs://QmQxQLZzvGv9EpVXxGfbowQYGDsL1hXMoKphzY6zyK6ieA",
]

module.exports = [
    vrfCoordinatorV2Address,
    subscriptionId,
    gasLane,
    callbackGasLimit,
    tokenURIs,
    mintFee,
]
