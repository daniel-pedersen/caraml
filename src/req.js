import request from 'superagent'

export default {
  get ({ uri, headers, query }) {
    return request.set(headers).query(query).get(uri)
  },
  post ({ uri, headers, query, body }) {
    return request.set(headers).query(query).post(uri).send(body)
  },
  put ({ uri, headers, query, body }) {
    return request.set(headers).query(query).put(uri).send(body)
  },
  patch ({ uri, headers, query, body }) {
    return request.set(headers).query(query).patch(uri).send(body)
  },
  delete ({ uri, headers, query }) {
    return request.set(headers).query(query).delete(uri)
  },
  head ({ uri, headers, query }) {
    return request.set(headers).query(query).head(uri)
  }
}
