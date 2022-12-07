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
            options.projection.geoNameId = 1;
            options.projection.userId = 1;
            const query = req.generateQuery(formData);
            const total = await this.mongo.db.collection(moduleConfig.collections.main).countDocuments(query);
            const items = await this.mongo.db.collection(moduleConfig.collections.main).find(query, options).toArray();
            const locationQuery = [];
            const usersQuery = [];
            for (const item of items) {
                if (item.geoNameId && locationQuery.indexOf(item.geoNameId) === -1) {
                    locationQuery.push(item.geoNameId);
                }
                if (item.userId && usersQuery.indexOf(item.userId) === -1) {
                    usersQuery.push(item.userId);
                }
            }
            if (locationQuery.length) {
                const locationsData = await this.mongo.db.collection(this.systemConfig.collections.geoLocations).find({
                    $or: locationQuery.map(i => ({
                        _id: i,
                    })),
                }).toArray();
                const continentsQuery = [];
                const countriesQuery = [];
                const citiesQuery = [];
                for (const item of locationsData) {
                    if (item.continent && continentsQuery.indexOf(item.continent) === -1) {
                        continentsQuery.push(item.continent);
                    }
                    if (item.country && countriesQuery.indexOf(item.country) === -1) {
                        countriesQuery.push(item.country);
                    }
                    if (item.city && countriesQuery.indexOf(item.city) === -1) {
                        citiesQuery.push(item.city);
                    }
                }
                const projection = {};
                projection[req.body.language] = 1;
                let continentsData = [];
                if (continentsQuery.length) {
                    continentsData = await this.mongo.db.collection(this.systemConfig.collections.geoContinents).find({
                        $or: continentsQuery.map(i => ({
                            _id: i,
                        })),
                    }, {
                        projection,
                    }).toArray();
                }
                let countriesData = [];
                if (countriesQuery.length) {
                    countriesData = await this.mongo.db.collection(this.systemConfig.collections.geoCountries).find({
                        $or: countriesQuery.map(i => ({
                            _id: i,
                        })),
                    }, {
                        projection,
                    }).toArray();
                }
                let citiesData = [];
                if (citiesQuery.length) {
                    citiesData = await this.mongo.db.collection(this.systemConfig.collections.geoCities).find({
                        $or: citiesQuery.map(i => ({
                            _id: i,
                        })),
                    }).toArray();
                }
                let usersData = [];
                if (usersQuery.length) {
                    usersData = await this.mongo.db.collection(this.systemConfig.collections.users).find({
                        $or: usersQuery.map(i => ({
                            _id: new ObjectId(i),
                        })),
                    }, {
                        projection: {
                            username: 1,
                        }
                    }).toArray();
                }
                for (const item of locationsData) {
                    if (item.continent) {
                        const continentData = continentsData.find(i => i._id === item.continent);
                        item.continent = continentData && continentData[req.body.language] ? continentData[req.body.language] : null;
                    }
                    if (item.country) {
                        const countryData = countriesData.find(i => i._id === item.country);
                        item.country = countryData && countryData[req.body.language] ? countryData[req.body.language] : null;
                    }
                    if (item.city) {
                        const cityData = citiesData.find(i => i._id === item.city);
                        const defaultCity = cityData["en-us"];
                        if (defaultCity) {
                            item.city = cityData && cityData[req.body.language] ? cityData[req.body.language] : defaultCity;
                        } else {
                            item.city = null;
                        }
                    }
                }
                for (const item of items) {
                    item.location = null;
                    if (item.geoNameId) {
                        const location = locationsData.find(i => i._id === item.geoNameId);
                        if (location) {
                            const locationArr = [];
                            if (location.continent) {
                                locationArr.push(location.continent);
                            }
                            if (location.country) {
                                locationArr.push(location.country);
                            }
                            if (location.city) {
                                locationArr.push(location.city);
                            }
                            item.location = locationArr.join(", ");
                        }
                    }
                    if (item.userId) {
                        const userData = usersData.find(i => String(i._id) === item.userId);
                        if (userData && item.username && !item.username !== userData.username) {
                            item.username = `${item.username} (${userData.username})`;
                        }
                    }
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
