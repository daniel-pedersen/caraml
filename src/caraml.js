import 'babel-polyfill'
import ramlParser from 'raml-1-parser'
import URITemplate from 'urijs/src/URITemplate'
import req from './req'
import _ from 'lodash'
import createError from 'http-errors'

export default caraml

const methodAliases = {
  get: ['get', 'find'],
  post: ['post', 'create'],
  put: ['put', 'update'],
  patch: ['patch'],
  del: ['delete', 'remove'],
  head: ['head']
}

function caraml ({
  apiPath,
  baseUriParameters = {},
  defaultHeaders,
  overridePrefix = '$'
}) {
  // Parse RAML file and apply all libraries and extensions
  let api = ramlParser.loadApiSync(apiPath).expand(true)

  // Ensure we are dealing with a JSON API
  if (api.mediaType().every(type => type.value() !== 'application/json')) {
    throw Error('caraml: Only supports JSON APIs')
  }

  // Set version in baseUriParameters
  if (api.version() !== '') {
    _.defaults(baseUriParameters, { version: api.version() })
  }

  // Generate types and resources
  const types = _.fromPairs(api.types().map(defineType))
  const resources = _.fromPairs(api.resources().map(defineResource))

  return { resources, types }

  // Returns resource name and resource function given a RAML Resource
  function defineResource (Resource, uriParameters = {}) {
    const uri = new URITemplate(Resource.absoluteUri())
    const resourceName = _.lowerFirst(_.camelCase(Resource.relativeUri().toJSON().slice(1)))
    const [
      parameterResources,
      nestedResources
    ] = _.partition(Resource.resources(), r => r.uriParameters().length !== 0)

    function resource (params) {
      if (parameterResources.length === 0) {
        throw Error(`caraml: Resource '${resourceName}' does not have any parametrized nested resources`)
      }

      if (_.isPlainObject(params)) {
        const keys = Object.keys(params).sort()
        const resource = parameterResources.find(r =>
          _.isEqual(r.uriParameters().map(p => p.name()).sort(), keys)
        )
        if (resource == null) {
          throw Error(`caraml: Cannot call on '${resourceName}' with keys ${keys}`)
        }
        const validation = _.flatMap(keys,
          key =>
            resource
              .uriParameters()
              .find(p => p.name() === key)
              .validateInstance(params[key])
        )
        if (validation.length !== 0) {
          throw Error(`caraml: Invalid parameters in call to '${resourceName}': ${validation.join(', ')}`)
        }
        return defineResource(resource, _.defaults({}, params, uriParameters))[1]
      }

      const [resource] = parameterResources.filter(
        r =>
          r.uriParameters().length === 1 &&
          r.uriParameters()[0].validateInstance(params).length === 0
      )

      if (resource == null) {
        throw Error(`caraml: Resource '${resourceName}' called with ambiguous parameter: ${params}`)
      }

      return defineResource(resource, _.defaults({
        [resource.uriParameters()[0].name()]: params
      }, uriParameters))[1]
    }

    Object.defineProperty(resource, '$', {
      get () {
        return uri.expand(uriParameters)
      }
    })

    // Apply methods
    Resource.methods()
      .map(defineMethod)
      .forEach(fn => {
        methodAliases[fn.name].forEach(alias => {
          resource[alias] = fn
        })
      })

    // Apply (non-parametrized) nested resources
    nestedResources
      .map(defineResource)
      .forEach(([name, fn]) => {
        resource[resource[name] != null ? overridePrefix + name : name] = fn
      })

    return [resourceName, resource]

    // Helper functions
    function defineMethod (Method) {
      switch (Method.method()) {
        case 'get':
          return async function get (query, { headers }) {
            validate({ query })
            return responseHandler(await req.get({
              uri: this.$,
              headers: _.defaults({}, headers, defaultHeaders, {
                Accept: 'application/json'
              }),
              query
            }))
          }
        case 'post':
          return async function post (body, query, { headers }) {
            validate({ body, query })
            return responseHandler(await req.post({
              uri: this.$,
              headers: _.defaults({}, headers, defaultHeaders, {
                Accept: 'application/json'
              }),
              query,
              body
            }))
          }
        case 'put':
          return async function put (body, query, { headers }) {
            validate({ body, query })
            return responseHandler(await req.put({
              uri: this.$,
              headers: _.defaults({}, headers, defaultHeaders, {
                Accept: 'application/json'
              }),
              query,
              body
            }))
          }
        case 'patch':
          return async function patch (body, query, { headers }) {
            validate({ body, query })
            return responseHandler(await req.patch({
              uri: this.$,
              headers: _.defaults({}, headers, defaultHeaders, {
                Accept: 'application/json'
              }),
              query,
              body
            }))
          }
        case 'delete':
          return async function del (query, { headers }) {
            validate({ query })
            return responseHandler(await req.delete({
              uri: this.$,
              headers: _.defaults({}, headers, defaultHeaders, {
                Accept: 'application/json'
              }),
              query
            }))
          }
      }
      throw Error('caraml: Only supports GET, POST, PUT, PATCH and DELETE methods')

      function validate ({ body, query }) {
        let validation
        if (query != null) {
          if (Method.queryString() != null) {
            validation = Method.queryString().validateInstance(query)
          } else {
            validation = _.flatMap(Object.keys(query), parameterName => {
              const param = Method.queryParameters().find(p =>
                p.name() === parameterName
              )
              if (param == null) {
                return [`No query parameter with name '${parameterName}'`]
              }
              return param.validateInstance(query[parameterName])
            })
          }
          if (validation.length !== 0) {
            throw Error(`caraml: Invalid query in '${Method.method()}' to '${resourceName}': ${validation.join(', ')}`)
          }
        }
        if (body != null) {
          const validation = Method.body().validateInstance(body)
          if (validation.length !== 0) {
            throw Error(`caraml: Invalid body in '${Method.method()}' to '${resourceName}': ${validation.join(', ')}`)
          }
        }
      }

      function responseHandler (res) {
        const Response = Method.responses().find(
          r => +r.code().value() === +res.status
        )
        if (res.error) {
          throw createError(res.status, Response.description(), res.body)
        }
        // FIXME: Parse response.headers() and response.body() to determine what type class to wrap response in
        return res.body
      }
    }
  }

  // Returns type name and type class given a RAML Type
  function defineType (type) {
    // FIXME
    const typeName = _.upperFirst(_.camelCase(type.name()))
    class Type {
    }
    return [typeName, Type]
  }
}
