const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleCustomSearchCredentials = require('../credentials/google-search.json')

async function robot() {
    const content = state.load()

    await fechImagesOfAllSentences(content)

    state.save(content)

    async function fechImagesOfAllSentences(content) {
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            let query
      
            if (sentenceIndex === 0) {
              query = `${content.searchTerm}`
            } else {
              query = `${content.searchTerm} ${content.sentences[sentenceIndex].keywords[0]}`
            }
      
            content.sentences[sentenceIndex].images = await fetchGoogleAndReturnImagesLinks(query)
            content.sentences[sentenceIndex].googleSearchQuery = query
          }
    }

    async function fetchGoogleAndReturnImagesLinks(query) {
        const response = await customSearch.cse.list({
            auth: googleCustomSearchCredentials.apiKey,
            cx: googleCustomSearchCredentials.searchEngineId,
            q: query,
            num: 2,
            searchType: 'image'
        })

        const imagesUrl = response.data.items.map((item) => {
            return item.link
        })

        return imagesUrl
    }
}

module.exports = robot