const readline = require('readline-sync')
const robots = {
    input: require('./robots/input.js'),
    text: require('./robots/text.js')
}

async function start() {
    const content = {
        maximunSentences: 7
    }

    robots.input(content)
    await robots.text(content)

    console.log(content)
}

start()