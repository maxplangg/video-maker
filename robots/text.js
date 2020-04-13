const algorithmia = require("algorithmia")
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey
const sentenceBoundaryDetection = require("sbd")

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgotithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2")
        const wikipediaResponse = await wikipediaAlgotithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get();

        content.sourceContentOriginal = wikipediaContent.content;
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
        content.senteces = []

        const senteces = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        
        senteces.forEach(sentence => {
            content.senteces.push({
                text: sentence,
                keywords: [],
                images: []
            })            
        });


        console.log(content.senteces )
    }
}

module.exports = robot
