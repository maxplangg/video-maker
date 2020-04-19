const algorithmia = require("algorithmia")
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey
const sentenceBoundaryDetection = require("sbd")

const watsonApiKey = require("../credentials/watson-nlu.json").apikey
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const nlu = new NaturalLanguageUnderstandingV1({
    version: '2019-07-12',
    authenticator: new IamAuthenticator({
        apikey: watsonApiKey,
    }),
    url: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/edb7b669-7409-47e7-9040-e38689e3c0e6'
});

const state = require('./state.js')

async function robot() {
    console.log('> [text-robot] Starting...')
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximunSentences(content)
    await fetchKeyworsOfAllSentences(content)

    state.save(content)

    async function fetchContentFromWikipedia(content) {
        console.log('> [text-robot] Fetching content from Wikipedia')
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgotithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2")
        const wikipediaResponse = await wikipediaAlgotithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get();

        content.sourceContentOriginal = wikipediaContent.content;

        console.log('> [text-robot] Fetching done!')
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')
           
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.startsWith('='))
                    return false

                return true
            })

            return withoutBlankLinesAndMarkdown.join(" ")
        }

        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
        }       
    }

    function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        
        sentences.forEach(sentence => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })            
        })
    }

    function limitMaximunSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximunSentences)
    }

    async function fetchKeyworsOfAllSentences(content) {
        console.log('> [text-robot] Starting to fetch keywords from Watson')
        for(const sentence of content.sentences) {
            console.log(`> [text-robot] Sentence: "${sentence.text}"`)

            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)

            console.log(`> [text-robot] Keywords: ${sentence.keywords.join(', ', '\n')}`)
        }
    }

    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    reject(error)
                    return
                }

                const keywords = response.result.keywords.map((keyword) => {
                    return keyword.text
                })

                resolve(keywords)
            })
        })
    }
}

module.exports = robot
