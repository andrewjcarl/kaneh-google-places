#!/usr/bin/env node

const { Client, Status }  = require("@googlemaps/google-maps-services-js");
const { Parser }          = require('json2csv');
const csv                 = require('async-csv');
const fs                  = require('fs').promises;

const argv = require('yargs')
    .usage('Usage: $0 -csv [input] -key [api key] -out [filename]')
    .demandOption(['csv','key', 'out'])
    .argv;

const client = new Client({});

const API_KEY   = argv.key;
const INPUT_CSV = argv.csv;
const OUT_CSV   = argv.out;

/**
 * Get Google Place ID from Search String
 * @param {String} searchString 
 */
async function getPlaceId(searchString) {
    return client.findPlaceFromText({
        params: {
            key: API_KEY,
            input: searchString,
            inputtype: 'textquery'
        }
    }).then((res) => {
        return res.data.candidates[0].place_id;
    });
}

/**
 * Get Google Place Details from Place ID 
 * @param {String} placeId 
 */
async function getPlaceDetails(placeId) {
    return client.placeDetails({
        params: {
            key: API_KEY,
            place_id: placeId
        }
    }).then((res) => {
        console.log(JSON.stringify(res.data));
        return res.data;
    });
}

/**
 * Place Object to contain Google data
 */
class Place {
    name;
    zip;
    formatted_address;
    formatted_phone_number;
    formatted_name;
    lat;
    lng;
    open_hours;
    maps_url;
    error = false;

    constructor(name, zip) {
        this.name = name;
        this.zip = zip;
    }

    setGoogleProps(obj) {
        this.formatted_address      = obj.formatted_address || '';
        this.formatted_phone_number = obj.formatted_phone_number || '';
        this.formatted_name         = obj.name || '';
        this.lat                    = obj.geometry.location.lat || 0;
        this.lng                    = obj.geometry.location.lng || 0;
        this.open_hours             = obj.opening_hours.weekday_text.join(', ') || '';
        this.maps_url               = obj.url || '';
    }

    notFound() {
        this.error = true;
    }
}

(async () => {
    try {
        let file    = await fs.readFile(INPUT_CSV);
        let csvData = await csv.parse(file);
        let output  = [];

        csvData = csvData.slice(1); // remove the header line
        
        let placeArr = [csvData[0]];
        for (const location of placeArr) {

            let googleDetails;

            let name = location[0];
            let zip  = location[1];

            let place        = new Place(name, zip);
            let searchString = `${name}, ${zip}`;

            console.log(`Searching for ${searchString}...`);

            let placeId = await getPlaceId(searchString);

            if (placeId) {
                googleDetails = await getPlaceDetails(placeId);
            }

            if (googleDetails && googleDetails.status === 'OK') {
                place.setGoogleProps(googleDetails.result)
            } else {
                place.notFound();
            }

            output.push(place);
        }

        const fields = [{
            label: 'Orignal Name',
            value: 'name'
        }, {
            label: 'Original Zip',
            value: 'zip'
        }, {
            label: 'Formatted Address',
            value: 'formatted_address'
        }, {
            label: 'Formatted Phone Number',
            value: 'formatted_phone_number'
        }, {
            label: 'Formatted Name',
            value: 'formatted_name'
        }, {
            label: 'Latitude',
            value: 'lat'
        }, {
            label: 'Longitude',
            value: 'lng'
        }, {
            label: 'Open Hours',
            value: 'open_hours'
        }, {
            label: 'Google URL',
            value: 'maps_url'
        }, {
            label: 'Search Error',
            value: 'error'
        }];

        const jsonParser = new Parser({ fields });
        const csvOutput = jsonParser.parse(output);

        await fs.writeFile(OUT_CSV, csvOutput, 'utf8');

        console.log('Done!');

    } catch (err) {
        console.error(err);
        return;
    }
})();