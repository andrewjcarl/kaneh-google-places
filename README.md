## Why make this?

I had a client who provided me with an excel sheet of 200 vendors with only a business name and zip code. They wanted to include other details on the website, and I was too lazy to manually search each one, so with a handful of free Google API credits I put this script together because it is way more fun than manually looking something up. 

## Example Use

Load a CSV file with the first column as a business name, and the second column the business zip code.

```
node index.js --csv input.csv --key {your google places api key} --out output.csv
```

## Reference Documentation 

* [Google Places API](https://developers.google.com/places/web-service/search)
* [NodeJS Google Services Package](https://googlemaps.github.io/google-maps-services-js/)
* [json2csv](https://www.npmjs.com/package/json2csv)
* [CSV Parse Library](https://csv.js.org/parse/api/)
* [Yargs](https://github.com/yargs/yargs)