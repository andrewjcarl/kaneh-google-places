#!/usr/bin/env node

const { Client, Status }  = require("@googlemaps/google-maps-services-js");
const { Parser }          = require('json2csv');
const csv                 = require('async-csv');
const fs                  = require('fs').promises;
const Place               = require('./Place');
const Service             = require('./Service');

const argv = require('yargs')
    .usage('Usage: $0 --csv [input] --key [api key] --out [filename]')
    .demandOption(['csv','key', 'out'])
    .boolean(['runonce', 'logging'])
    .default('runonce', false)
    .default('logging', false)
    .argv;

const API_KEY   = argv.key;
const INPUT_CSV = argv.csv;
const OUT_CSV   = argv.out;
const RUN_ONCE  = argv.runonce;
const LOGGING   = argv.logging;

console.log(argv._);

(async () => {

    const service = new Service(API_KEY);

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

            let {search_err, search_status, place_id} = await service.getPlaceId(searchString);

            if (search_err) {
                place.notFound(search_status);
                output.push(place);
                continue;
            }

            console.log(`Place found at ${place_id}...`);

            let {details_err, details_status, details_data} = await service.getPlaceDetails(place_id);

            if (details_err) {
                place.notFound(details_status);
                output.push(place);
                continue;
            }

            if (LOGGING) {
                console.log('Logging Google place result... \n.\n.\n.\n.');
                console.log(JSON.stringify(details_data));
                console.log('\n.\n.\n.\n.');
            }

            place.setGoogleProps(details_data);
            place.setAddressProps(details_data);
            output.push(place);

            if (RUN_ONCE) {
                break;
            } 
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
            label: 'address_1',
            value: 'address_1'
        }, { 
            label: 'address_2',
            value: 'address_2'
        }, { 
            label: 'address_3',
            value: 'address_3'
        }, { 
            label: 'city',
            value: 'city'
        }, { 
            label: 'state',
            value: 'state'
        }, { 
            label: 'country',
            value: 'country'
        }, { 
            label: 'postal_code',
            value: 'postal_code'
        }, {
            label: 'phone_number',
            value: 'formatted_phone_number'
        }, {
            label: 'name',
            value: 'formatted_name'
        }, {
            label: 'lat',
            value: 'lat'
        }, {
            label: 'lng',
            value: 'lng'
        }, {
            label: 'open_hours',
            value: 'open_hours'
        }, {
            label: 'maps_url',
            value: 'maps_url'
        }, {
            label: 'website',
            value: 'website'
        }, {
            label: 'place_id',
            value: 'place_id'
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