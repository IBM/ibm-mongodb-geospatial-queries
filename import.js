const fs = require('fs')
const datamaker = require('datamaker')
const { MongoClient } = require('mongodb')

// other parameters
const batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 500
const sleepTime = process.env.SLEEP ? parseInt(process.env.SLEEP) : 10
const dbName = process.env.DATABASE_NAME || 'vehicles'
const collName = process.env.COLLECTION_NAME || 'taxis'
const templateFile = process.env.TEMPLATE_FILE || './taxi.json'
const url = process.env.MONGO_URL || 'mongodb://0.0.0.0:27017'

// use CA?
const options = { }
if (process.env.MONGO_CA_FILE) {
  options.tls = true
  options.tlsCAFile = process.env.MONGO_CA_FILE
}

// create MongoDB client
console.log('url & options', url, options)
const client = new MongoClient(url, options)

// load datamaker template
console.log('loading template file', templateFile)
const template = fs.readFileSync(templateFile, { encoding: 'utf8' }).toString()

// generate random data
const generate = async (iterations) => {
  const retval = []
  return new Promise((resolve, reject) => {
    datamaker.generate(template, 'json', iterations)
    .on('data', (d) => {
      retval.push(JSON.parse(d))
    })
    .on('end', (d) => { 
      resolve(retval)
    })
  })
}

// main
const main = async () => {
  // connect to MongoDB
  console.log('Connecting to MongoDB', url)
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection(collName)

  //create index
  await collection.createIndex( { "geometry" : "2dsphere" })
  console.log("Index created")

  // insert 100x500 taxis
  for (let i=0; i <100; i++) {

    // generate random data
    //console.log(`writing ${batchSize} products to ${dbName}/${collName}`)
    const taxis = await generate(batchSize)

    // write to database
    const insertResult = await collection.insertMany(taxis)
    console.log("Inserting ", i, " of 100 sets of 500")
  } 
  console.log("Finished!")
  process.exit()


}

main()