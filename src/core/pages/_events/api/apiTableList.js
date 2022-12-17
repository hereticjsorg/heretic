import {
    ObjectId
} from "mongodb";
import FormData from "../data/form";
import moduleConfig from "../admin.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error"
                });
            }
            options.projection.geoNameIdCity = 1;
            options.projection.geoNameIdCountry = 1;
            options.projection.userId = 1;
            const query = req.generateQuery(formData);
            const total = await this.mongo.db.collection(moduleConfig.collections.main).countDocuments(query);
            const items = await this.mongo.db.collection(moduleConfig.collections.main).find(query, options).toArray();
            const usersQuery = [];
            const citiesQuery = [];
            const countriesQuery = [];
            for (const item of items) {
                if (item.userId && usersQuery.indexOf(item.userId) === -1) {
                    usersQuery.push(item.userId);
                }
                if (item.geoNameIdCity && usersQuery.indexOf(item.geoNameIdCity) === -1) {
                    citiesQuery.push(item.geoNameIdCity);
                }
                if (item.geoNameIdCountry && countriesQuery.indexOf(item.geoNameIdCountry) === -1) {
                    countriesQuery.push(item.geoNameIdCountry);
                }
            }
            if (usersQuery.length) {
                const usersData = await this.mongo.db.collection(this.systemConfig.collections.users).find({
                    $or: usersQuery.map(i => ({
                        _id: new ObjectId(i),
                    })),
                }, {
                    projection: {
                        _id: 1,
                        username: 1,
                    }
                }).toArray();
                for (const item of items) {
                    if (item.userId) {
                        const userData = usersData.find(i => String(i._id) === item.userId);
                        if (userData && item.username && !item.username !== userData.username) {
                            item.username = `${item.username} (${userData.username})`;
                        }
                    }
                }
            }
            let citiesData = [];
            if (citiesQuery.length) {
                const projection = {
                    "en-us": 1,
                };
                projection[req.body.language] = 1;
                citiesData = await this.mongo.db.collection(this.systemConfig.collections.geoCities).find({
                    $or: citiesQuery.map(i => ({
                        _id: String(i),
                    })),
                }, {
                    projection,
                }).toArray();
            }
            let countriesData = [];
            if (countriesQuery.length) {
                const projection = {
                    "en-us": 1,
                };
                projection[req.body.language] = 1;
                countriesData = await this.mongo.db.collection(this.systemConfig.collections.geoCountries).find({
                    $or: countriesQuery.map(i => ({
                        _id: String(i),
                    })),
                }, {
                    projection,
                }).toArray();
            }
            for (const item of items) {
                const locationArr = [];
                if (item.geoNameIdCountry) {
                    const countryData = countriesData.find(i => String(i._id) === String(item.geoNameIdCountry));
                    const defaultContinent = countryData["en-us"] && countryData["en-us"].continent ? countryData["en-us"].continent : null;
                    const langContinent = countryData[req.body.language] && countryData[req.body.language].continent ? countryData[req.body.language].continent : null;
                    if (langContinent) {
                        locationArr.push(langContinent);
                    } else if (defaultContinent) {
                        locationArr.push(defaultContinent);
                    }
                    const defaultCountry = countryData["en-us"] && countryData["en-us"].country ? countryData["en-us"].country : null;
                    const langCountry = countryData[req.body.language] && countryData[req.body.language].country ? countryData[req.body.language].country : null;
                    if (langCountry) {
                        locationArr.push(langCountry);
                    } else if (defaultCountry) {
                        locationArr.push(defaultCountry);
                    }
                }
                if (item.geoNameIdCity) {
                    const cityData = citiesData.find(i => String(i._id) === String(item.geoNameIdCity));
                    const defaultCity = cityData["en-us"] || null;
                    const langCity = cityData[req.body.language] || null;
                    if (langCity) {
                        locationArr.push(langCity);
                    } else if (defaultCity) {
                        locationArr.push(defaultCity);
                    }
                }
                if (locationArr.length) {
                    item.location = locationArr.join(", ");
                }
            }
            return rep.code(200).send({
                items: req.processDataList(items, formData.getFieldsFlat()),
                total,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
