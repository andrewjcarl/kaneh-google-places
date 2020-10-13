/**
 * Place Object to contain Google data
 */
class Place {
    name = '';
    zip = '';
    formatted_address = '';
    formatted_phone_number = '';
    formatted_name = '';
    address_1 = '';
    address_2 = '';
    address_3 = '';
    city = '';
    postal_code = '';
    state = '';
    country = '';
    lat = 0;
    lng = 0;
    open_hours = '';
    maps_url = '';
    website = '';
    status = '';
    place_id = '';
    meta = '';
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
        this.website                = this.safeSet(obj.website, '');
        this.place_id               = this.safeSet(obj.place_id, '');
        
        if (obj.hasOwnProperty('opening_hours') && obj.opening_hours.hasOwnProperty('weekday_text')) {
            this.open_hours = this.safeSet(obj.opening_hours.weekday_text, '', (arr) => {return arr.length > 0 ? arr.join(', ') : arr});
        }
    }

    setAddressProps(obj) {
        let props = {
            'floor': null,
            'street_number': null,
            'route': null,
            'locality': null, // city
            'administrative_area_level_1': null, // state
            'postal_code': null, // zip
            'country': null
        };

        for (const component of obj.address_components) {
            for (const type of component.types) {
                if (Object.keys(props).indexOf(type) > -1) {
                    props[type] = component.short_name;
                }
            }
        }

        //  format address
        const address_1 = `${props.street_number} ${props.route}`;

        this.address_1              = this.safeSet(address_1, '');
        this.address_2              = this.safeSet(props.floor, '');
        this.address_3              = this.safeSet('', '');
        this.city                   = this.safeSet(props.locality, '');
        this.postal_code            = this.safeSet(props.postal_code, '');
        this.state                  = this.safeSet(props.administrative_area_level_1, '');
        this.country                = this.safeSet(props.country, '');
    }

    notFound(status) {
        this.status = status;
        this.error = true;
    }
}

module.exports = Place;