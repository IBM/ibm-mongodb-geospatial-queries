
const { parseArgs } = require('node:util')
const argv = process.argv.slice(2)
const options = {
  topleftlong: {
    type: 'string',
    default: "-0.1291527"
  },
  topleftlat: {
    type: 'string',
    default: "51.5011114"
  },
  bottomrightlong: {
    type: 'string',
    default: "-0.1254708"
  },
  bottomrightlat: {
    type: 'string',
    default: "51.4981261"
  },
  num_taxis: {
    type: 'string',
    default: '5'
  },
  vehicle_type: {
    type: 'string',
    default: "any"
  }
}
const { values } = parseArgs({ argv, options })
//console.log(values)

const { MongoClient } = require('mongodb')

// other parameters
const dbName = process.env.DATABASE_NAME || 'vehicles'
const collName = process.env.COLLECTION_NAME || 'taxis'
const url = process.env.MONGO_URL || 'mongodb://0.0.0.0:27017'

const opts = {}
if (process.env.MONGO_CA_FILE) {
  opts.tls = true
  opts.tlsCAFile = process.env.MONGO_CA_FILE
}

// create MongoDB client
//console.log('url & options', url, opts)
const client = new MongoClient(url, opts)

// main
const main = async () => {
  // connect to MongoDB
  //console.log('Connecting to MongoDB', url)
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection(collName)
  
  values.topleftlat = parseFloat(values.topleftlat)
  values.topleftlong = parseFloat(values.topleftlong)
  values.bottomrightlat = parseFloat(values.bottomrightlat)
  values.bottomrightlong  = parseFloat(values.bottomrightlong)




  const query = {
    '$and': [
      {
        geometry: {
          $geoWithin: {
            $geometry: {
              type: "Polygon",
              coordinates: [
                  [
                    [values.topleftlong, values.topleftlat],   //top left corner
                    [values.bottomrightlong, values.topleftlat],  // top right corner
                    [values.bottomrightlong, values.bottomrightlat], //bottom right corner
                    [values.topleftlong, values.bottomrightlat],   // bottom left corner
                    [values.topleftlong, values.topleftlat]   //top left corner (again!)
                  ]
                ]
            }
          }
        }
      }
    ]
  }

  if (values.vehicle_type != "any") {
    //looking for a specific vehicle type.. so add it to the query object 
    query.$and.push({ 'properties.vehicle_type': { '$eq': values.vehicle_type } })
  }

  //console.log(query)

  const options = { "limit": parseInt(values.num_taxis) }

  const cursor = await collection.find(query, options)

  for await (const doc of cursor) {
    console.log(doc);
  }
  await client.close()
}


main()


