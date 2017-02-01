const td = require('testdouble')
const users = require('./users.json')
const req = td.replace('../../dist/req')

const baseUri = 'https://se01.api.example.com/v1'

// Stub /users
td.when(req.get(td.matchers.contains({
  uri: `${baseUri}/users`
}))).thenReturn(Promise.resolve(users))

for (let i = 0; i < users.length; ++i) {
  // Stub /users/{id}
  td.when(req.get(td.matchers.contains({
    uri: `${baseUri}/users/${i + 1}`
  }))).thenReturn(Promise.resolve(users[i]))

  // Stub /users/{id}/messages
  td.when(req.get(td.matchers.contains({
    uri: `${baseUri}/users/${i + 1}/messages`
  }))).thenReturn(Promise.resolve(users[i].messages))

  // Stub /users/{username}
  td.when(req.get(td.matchers.contains({
    uri: `${baseUri}/users/${users[i].username}`
  }))).thenReturn(Promise.resolve(users[i]))

  // Stub /users/{username}/get
  td.when(req.get(td.matchers.contains({
    uri: `${baseUri}/users/${users[i].username}/get`
  }))).thenReturn(Promise.resolve(users[i].username))

  for (let j = 0; j < users[i].messages.length; ++j) {
    // Stub /users/{id}/messages/{id}
    td.when(req.get(td.matchers.contains({
      uri: `${baseUri}/users/${i + 1}/messages/${j + 1}`
    }))).thenReturn(Promise.resolve(users[i].messages[j]))
  }
}
