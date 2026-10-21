import app from '../packages/server/src/index.js'

// Only use this entry point behind the single Nginx proxy in compose.yaml.
// The API port is not published. Nginx overwrites the forwarded client address.
app.set('trust proxy', 1)
app.listen(8082, '0.0.0.0', () => {
  console.log('Moten Codes API listening on port 8082')
})
