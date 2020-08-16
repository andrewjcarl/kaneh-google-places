#!/usr/bin/env node

import {Client, Status} from "@googlemaps/google-maps-services-js";
import { argv } from "process";
const parse = require('csv-parse');
const fs = require('fs');

const readCsv = argv[0];


const client = new Client({});



//  