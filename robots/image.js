const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleCustomSearchCredentials = require('../credentials/google-search.json')

async function robot() {
    const content = state.load()

    await fechImagesOfAllSentences(content)
    await downloadAllImages(content)
    await convertAllImagens(content)
    await createAllSentenceImages(content)
    await createYouTubeThumbnail()

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

    async function downloadAllImages(content) {
        content.downloadedImages = []

        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            const images = content.sentences[sentenceIndex].images

            for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
                const imageUrl = images[imageIndex]

                try {
                    if (content.downloadedImages.includes(imageUrl))
                        throw new Error("Imagem já foi baixada")
                    
                    await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)

                    console.log(`> Baixou imagem com sucesso: ${imageUrl}`)

                    content.downloadedImages.push(imageUrl)
                    break
                } catch (error) {
                    console.log(`> Erro ao baixar ${imageUrl}: ${error}`)
                }
            }
        }
    }

    async function downloadAndSave(url, fileName) {
        return imageDownloader.image({
            url: url,
            dest: `./content/${fileName}`
        })
    }
}

module.exports = robot
