import fs from 'fs'
import path from 'path'
import minimist from 'minimist'
import {abc, ABC, artists} from './shared.mjs'

const args = minimist(process.argv.slice(2));

const MIN_LEN = 3;

const MAX_SONGS = 600;


const BLOCKED_WORDS = [
    'songtext',
    'refrain',
    'lyrics',
    'Bridge',
    'damals',
    'interlude',
    'kollegah',
    'camora',
    'raf',
    'refrain',
    'bridge',
    'pre-refrain',
    'wenn',
    'dieses',
    'weil',
    'dann',
    'seyed',
    'chorus',
    'post-refrain',
    'helene',
    'fischer',
    'rapper',
    'summer',
    'cem',
    'khalil',
    'image__no22',
    'während',
    'gzuz',
    'veröffentlichung',
    'währenddessen',
    'script-sc-1hyeaua-2',
    'strophe',
    'pre-hook',
    'capital',
    'bushido',
    'keiner',
    'shindy',
    'koenichstheyn',
    'ghettoworkout',
    'hook', 'bonez', 'part', 'intro', 'denn', 'deshalb', 'maxwell', 'komm', 'doch']

let artistsDir = './artists';
let lyricsDir = './lyrics'
let artistFiles = fs.readdirSync(artistsDir)



let wordCollection = []
const findInCollection = (key) => {
    return wordCollection.find(w => w.key === key)
}


for(let artist of artists) {
    if(args.artist && artist.id !== args.artist)continue;
    //let artist = JSON.parse(fs.readFileSync(artistsDir + '/' + artist.id + '.json'))

    let lyricFiles = fs.readdirSync(path.join(lyricsDir, ""+artist.id))

    console.log(`${artist.name}: ${lyricFiles.length} Songs`)

    let songCounter = 0;
    for(let lyricFile of lyricFiles) {
        if(songCounter >= MAX_SONGS) break;
        importLyricFile(artist, lyricFile)
        songCounter++;
    }

}

function importLyricFile(artist, file) {
    let song = JSON.parse(fs.readFileSync(path.join(lyricsDir, ""+ artist.id, file)))

    let text = song.text;

    for (let word of text.split(' ')) {

        if (word.length < MIN_LEN) continue;
        if (!ABC.includes(word[0])) continue;
        if(BLOCKED_WORDS.includes(word.toLowerCase())) continue;

        let key = word.toLowerCase();

        let entry = findInCollection(key)
        if (!entry) {
            let index = wordCollection.push({
                word,
                key,
                count: 1,
                artistCount: {}
            })
            entry = wordCollection[index-1];
        } else {
            entry.count++
        }
        if(entry.artistCount[artist.id]) {
            entry.artistCount[artist.id]++
        } else {
            entry.artistCount[artist.id] = 1
        }


    }
}


fs.writeFileSync('./words.json', JSON.stringify(wordCollection.sort((a, b) => a.count - b.count).filter(w => w.count > 3 && w.key.length > 3)))

