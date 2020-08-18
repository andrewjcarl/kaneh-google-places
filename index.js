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

        if (res.data.status === 'ZERO_RESULTS' || 
            res.data.status === 'INVALID_REQUEST' || 
            res.data.candidates.length === 0) {

            return {
                search_err: true,
                search_status: res.data.status,
                place_id: null
            }
        }
        
        if (res.data.status === 'OK') {
            return {
                search_err: false,
                search_status: res.data.status,
                place_id: res.data.candidates[0].place_id
            }
        }

        return {
            search_err: true, 
            search_status: res.data.status,
            place_id: null
        };
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
        if (res.data.status !== 'OK') {
            return {
                details_err: true,
                details_status: res.data.status,
                details_data: null
            }
        }

        return {
            details_err: null,
            details_status: res.data.status,
            details_data: res.data
        };
    });
}

/**
 * Place Object to contain Google data
 */
class Place {
    name = '';
    zip = '';
    formatted_address = '';
    formatted_phone_number = '';
    formatted_name = ''
    lat = 0;
    lng = 0;
    open_hours = '';
    maps_url = '';
    status = '';
    error = false;

    constructor(name, zip) {
        this.name = name;
        this.zip = zip;
    }

    safeSet(prop, def, transform) {
        if (typeof prop === 'undefined' || prop === null) {
            return def;
        } else if (typeof transform === 'function') {
            return transform(prop);
        } else {
            return prop;
        }
    }

    setGoogleProps(obj) {
        this.formatted_address      = this.safeSet(obj.formatted_address, '');
        this.formatted_phone_number = this.safeSet(obj.formatted_phone_number, '');
        this.formatted_name         = this.safeSet(obj.name, '');
        this.lat                    = this.safeSet(obj.geometry.location.lat, 0);
        this.lng                    = this.safeSet(obj.geometry.location.lng, 0);
        this.maps_url               = this.safeSet(obj.url, '');

        if (obj.hasOwnProperty('opening_hours') && obj.opening_hours.hasOwnProperty('weekday_text')) {
            this.open_hours = this.safeSet(obj.opening_hours.weekday_text, '', (arr) => {return arr.length > 0 ? arr.join(', ') : arr});
        }
    }

    notFound(status) {
        this.status = status;
        this.error = true;
    }
}

(async () => {
    try {
        let file     = await fs.readFile(INPUT_CSV);
        let fileData = await csv.parse(file);
        let output   = [];

        fileData = fileData.slice(1); // remove the header line
        
        for (const location of fileData) {

            let name = location[0];
            let zip  = location[1];

            let place        = new Place(name, zip);
            let searchString = `${name}, ${zip}`;

            console.log(`Searching for ${searchString}...`);

            let {search_err, search_status, place_id} = await getPlaceId(searchString);

            if (search_err) {
                place.notFound(search_status);
                output.push(place);
                continue;
            }

            console.log(`Place found at ${place_id}...`);

            let {details_err, details_status, details_data} = await getPlaceDetails(place_id);

            if (details_err) {
                place.notFound(details_status);
                output.push(place);
                continue;
            }

            place.setGoogleProps(details_data.result);
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
            label: 'Search Status',
            value: 'status'
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