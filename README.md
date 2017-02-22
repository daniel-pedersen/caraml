# caraml
Generates an optimized SDK from a RAML specification.
Works with modern browsers and node.

## Usage and Documentation
Install with: `npm install -S caraml` or `yarn add caraml`

```js
import caraml from 'caraml'

const options = {
  // Path to root RAML file
  apiPath: './api.raml',
  // Parameters in base URI - version is auto-included
  baseUriParameters: {
    region: 'se01'
  },
  // Headers to send with every request unless overridden
  defaultHeaders: {
    Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
  },
  // Prefix on resources when naming collisions occur
  overridePrefix: '$'
}

const { resources } = caraml(options)

// The resources object contains the top-level RAML resources (lower cased)
const { users } = resources

// Nested resources are properties of the parent resource
users.me // = /users/me

// Parameters are added by calling with an object
users({ id: 42 }) // = /users/42 as /users/{id}
users({ username: 'alladin' }) // = /users/alladin as /users/{username}
// ..or without in non-ambiguous cases
users(42) // = /users/42

// The above can be combined to reach any resource
users(42).messages(1).attachments // = /users/42/messages/1/attachments

// Methods are functions that return promises
const query = 'query=string' || { query: 'parameters' }
const data = { json: 'data' }
// GET
users.get(query, options)
users.find(query, options)
// POST
users.post(data, query, options)
users.create(data, query, options)
// PUT
users.put(data, query, options)
users.update(data, query, options)
// PATCH
users.patch(data, query, options)
// DELETE
users.delete(query, options)
users.remove(query, options)

// Methods are added automatically to resources
users(42).messages.post(data) // = POST /users/42/messages

// When collisions occur between method names and nested resources, the nested
// resource can be obtained by prefixing with the overridePrefix
users(42).$find.find(query) // = GET /users/42/find?query=string
users(42).find(query) // = GET /users/42?query=string
```

## Examples
### Using async/await (recommended)
```js
const message = { text: 'Brevity is the soul of wit' }

async function spreadMessage () {
  const allUsers = await users.find()
  for (let user of allUsers) {
    await users(user.id).messages.create(message)
  }
}
```

### Using promises
```js
function spreadMessage () {
  return users.find().then(allUsers => {
    allUsers.reduce((promise, user) => {
      return promise.then(() => users(user.id).messages.create(message))
    }, Promise.resolve())
  })
}
```

## TODO
- [ ] Write tests for methods
- [ ] Support for types
  - [ ] Wrap responses in type
- [ ] Make optimizations to nested resource creation when calling with parameters
- [ ] Improve comments/documentation
- [ ] Custom error classes

## Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D
