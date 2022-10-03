import fetch from 'node-fetch';
import fs from 'fs'
import {parse} from 'node-html-parser';
import {abc, ABC, artists} from './shared.mjs'
import minimist from "minimist";
const args = minimist(process.argv.slice(2));
let headers = {
    'Authorization': 'Bearer 07ALDc5QOR-oinvP1_jYo1Ct2OusROloz2va3PAnvqq8IIFRzuppkHdAH1VVDxGL'
};
let apiUrl = 'https://api.genius.com';

let SONG_LIMIT = 100;


const syncArtist = async (artist_id) => {
    let res = await fetch(apiUrl + '/artists/' + artist_id, {headers})
    let artistData = await res.json()
    fs.writeFileSync('artists/' + artist_id + '.json', JSON.stringify(artistData.response.artist))
    let next_page = 1;

    //let songCounter = SONG_LIMIT;
    while (next_page) {
        //if(songCounter >= 100) return;
        let res = await fetch(apiUrl + '/artists/' + artist_id + '/songs?per_page=50&page='+next_page, {headers})
        let json = await res.json()

        next_page = json.response.next_page


        let artist_dir = 'lyrics/' + artist_id
        if (!fs.existsSync(artist_dir)) {
            fs.mkdirSync(artist_dir);
        }

        for (let song of json.response.songs) {
            let res = await fetch(song.url, {headers})
            let html = await res.text()

            try {

                const root = parse(html);

                let text = root.querySelector('[data-lyrics-container="true"]').text

                if (!text) continue;
                text = text.replaceAll('[', ' ')
                text = text.replaceAll(']', ' ')
                text = text.replaceAll(',', '')
                text = text.replaceAll('\'', '')
                text = text.replaceAll(':', '')
                text = text.replaceAll('.', ' ')
                text = text.replaceAll('(', ' ')
                text = text.replaceAll(')', ' ')
                text = text.replaceAll('!', ' ')
                text = text.replaceAll('?', ' ')

                let lines = []
                let lastLineIndex = 0;
                for (let i = 0; i < text.length; i++) {
                    if (abc.includes(text[i]) && ABC.includes(text[i + 1])) {
                        lines.push(text.substring(lastLineIndex + 1, i + 1))
                        lastLineIndex = i
                    }
                }
                text = lines.join(' __NEW_LINE__ ')

                fs.writeFileSync(artist_dir + '/' + song.id + '.json', JSON.stringify(
                    {
                        ...song,
                        text
                    }
                ))
            } catch (e) {
                console.error('Fehler bei', song.full_title, ': ', e.message)
            }
        }
    }
}

for(let artist of artists) {
    if (args.artist && artist.id !== args.artist) continue;
    syncArtist(artist.id)
}