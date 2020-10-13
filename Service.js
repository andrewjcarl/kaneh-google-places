const { Client, Status }  = require("@googlemaps/google-maps-services-js");

/**
 * Google Service Wrapper
 */
class Service {

	API_KEY = "";

	constructor(key) {
		this.API_KEY = key;
		this.client = new Client({});
	}

	/**
	 * Get Google Place ID from Search String
	 * @param {String} searchString 
	 */
	async getPlaceId(searchString) {
	    return client.findPlaceFromText({
	        params: {
	            key: this.API_KEY,
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
	        
	        if (res.data.status === 'OK' && res.data.candidates.length > 0) {
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
	async getPlaceDetails(placeId) {
	    return client.placeDetails({
	        params: {
	            key: this.API_KEY,
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
	            details_data: res.data.result
	        };
	    });
	}

}

module.exports = Service;