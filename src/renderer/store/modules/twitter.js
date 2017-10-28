import { TwitterClient } from '../../modules/twitter'

const defaultGetParams = {
  include_entities: true,
  tweet_mode: 'extended',
  count: 200
}

const state = {
  timeline: [],
  mentions: [],
  favorites: []
}

const mutations = {
  ADD_TIMELINE (state, tweets) {
    state.timeline = tweets.concat(state.timeline)
  },
  ADD_MENTIONS (state, tweets) {
    state.mentions = tweets.concat(state.mentions)
  },
  ADD_FAVORITES (state, tweets) {
    state.favorites = tweets.concat(state.favorites)
  }
}

const actions = {
  fetchTimeline ({ commit }) {
    let params = defaultGetParams
    if (state.timeline.length > 0) {
      params.since_id = state.timeline[0].id_str
    }
    TwitterClient.fetchTweets('statuses/home_timeline', params)
      .then((tweets) => {
        if (tweets.length > 0) {
          commit('ADD_TIMELINE', tweets)
        }
      })
  },
  fetchMentions ({ commit }) {
    TwitterClient.fetchTweets('statuses/mentions_timeline', defaultGetParams)
      .then((tweets) => {
        if (tweets.length > 0) {
          commit('ADD_MENTIONS', tweets)
        }
      })
  },
  fetchFavorites ({ commit }) {
    TwitterClient.fetchTweets('favorites/list', defaultGetParams)
      .then((tweets) => {
        if (tweets.length > 0) {
          commit('ADD_FAVORITES', tweets)
        }
      })
  }
}

export default {
  state,
  mutations,
  actions
}
