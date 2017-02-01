import './resources/stubs'
import caraml from '../dist/caraml'
import test from 'ava'

const options = {
  apiPath: 'test/resources/api.raml',
  baseUriParameters: {
    region: 'se01'
  },
  defaultHeaders: {
    Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
  }
}
const sdk = caraml(options)

test('caraml generates resources from document root (lower camelCased)', t => {
  const { resources } = sdk
  t.deepEqual(Object.keys(resources).sort(), ['testIt', 'users'])
})

test('caraml generates types from document root (upper CamelCased)', t => {
  const { types } = sdk
  t.deepEqual(Object.keys(types).sort(), ['Attachment', 'Comment', 'Message', 'Poke', 'Url', 'User'])
})

test('users resource has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users).sort(), ['create', 'find', 'get', 'post'])
})

test('testIt resource has no properties', t => {
  const { resources: { testIt } } = sdk
  t.is(Object.keys(testIt).length, 0)
})

test('test throws when called with anything', t => {
  const { resources: { test } } = sdk
  t.throws(() => test({ '': 4 }))
  t.throws(() => test())
  t.throws(() => test(1))
  t.throws(() => test('x'))
})

test('users does not throw when called with id or username of correct type', t => {
  const { resources: { users } } = sdk
  t.notThrows(() => users({ id: 1 }))
  t.notThrows(() => users({ username: 'x' }))
})

test('users does not throw when called with values that are unambiguous', t => {
  const { resources: { users } } = sdk
  t.notThrows(() => users(1))
  t.notThrows(() => users('x'))
})

test('users throws when called with an object without id or username key', t => {
  const { resources: { users } } = sdk
  t.throws(() => users({}))
  t.throws(() => users({ ids: [1] }))
})

test('users throws when called with id that is non-integer or less than 1', t => {
  const { resources: { users } } = sdk
  t.throws(() => users({ id: 'x' }))
  t.throws(() => users({ id: 1.1 }))
  t.throws(() => users({ id: 0 }))
  t.throws(() => users({ id: -1 }))
})

test('users throws when called with username that is non-string or empty string', t => {
  const { resources: { users } } = sdk
  t.throws(() => users({ username: 4 }))
  t.throws(() => users({ username: '' }))
})

test('users throws when called with an object with both id and username keys', t => {
  const { resources: { users } } = sdk
  t.throws(() => users({ id: 3, username: 'x' }))
})

test('users(:id) has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users({ id: 5 })).sort(), ['delete', 'find', 'get', 'messages', 'patch', 'put', 'remove', 'update'])
})

test('users(:username) has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users({ username: 'aladdin' })).sort(), ['$get', 'delete', 'extra', 'find', 'get', 'patch', 'put', 'remove', 'update'])
})

test('users(:id).messages has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users({ id: 5 }).messages).sort(), ['create', 'find', 'get', 'post'])
})

test('users(:id).messages(:id) has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users({ id: 5 }).messages(3)).sort(), ['attachment', 'delete', 'find', 'get', 'patch', 'put', 'remove', 'update'])
})

test('users(:id).messages(:id).attachment has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users({ id: 5 }).messages(3).attachment).sort(), ['create', 'post'])
})

test('users(:username).$get has correct properties', t => {
  const { resources: { users } } = sdk
  t.deepEqual(Object.keys(users({ username: 'aladdin' }).$get).sort(), ['find', 'get'])
})

test('users(:username).extra has no properties', t => {
  const { resources: { users } } = sdk
  t.is(Object.keys(users({ username: 'aladdin' }).extra).length, 0)
})
