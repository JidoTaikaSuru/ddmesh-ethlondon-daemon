const redis = require('redis')

const getRedisClient = async () => {
  try {
    const client = redis.createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    })
    await client.connect()
    return client
  } catch (err) {
    console.log('Cannot Connect to redis..', err)
    throw new Error(err)
  }
}

const pushMapToRedisWithKey = async function (key, object) {
  console.log(object)
  const redis = await getRedisClient()
  await redis.hSet(key, object)
  redis.disconnect()
}
const pushStringToRedisWithKey = async function (key, value) {
  const redis = await getRedisClient()
  await redis.set(key, value)
  console.log(`Pushed ${key} to redis with value ${value}`)
  redis.disconnect()
}
const getStringKey = async function (key) {
  const redis = await getRedisClient()
  const value = await redis.get(key)
  redis.disconnect()
  return value
}
const delKey = async function (key) {
  const redis = await getRedisClient()
  await redis.del(key)
  redis.disconnect()
}

const getMapKey = async function (key) {
  const redis = await getRedisClient()
  const value = await redis.hGet(key)
  redis.disconnect()
  return value
}


module.exports = {
  pushMapToRedisWithKey,
  pushStringToRedisWithKey,
  getStringKey,
  delKey,
  getMapKey
}